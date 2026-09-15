import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import type { Server } from "http";
import { io as socketClient } from "socket.io-client";
import { createApp } from "./app";
import { initRealtime } from "./realtime";
import { Consultant, ExitFeedback as ExitFeedbackModel, Group, HealthTip, User } from "./models";

/**
 * End-to-end smoke test: boots the real Express app against an in-memory MongoDB and
 * exercises every route group over actual HTTP — no mocks anywhere.
 *
 *   npm run test:smoke
 *
 * Exits 0 with a summary when everything passes; exits 1 on the first failure.
 */

let base = "";
let passed = 0;
const results: string[] = [];

const check = (name: string, condition: boolean, detail?: string) => {
  if (!condition) {
    results.push(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
    console.error(results.join("\n"));
    process.exit(1);
  }
  passed += 1;
  results.push(`✓ ${name}`);
};

const call = async (method: string, path: string, body?: unknown, token?: string) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json()) as any };
};

const run = async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("healingsathi-test"));

  const server: Server = createApp().listen(0);
  const realtime = initRealtime(server);
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

  // ---- health ----
  const health = await call("GET", "/health");
  check("GET /health", health.status === 200 && health.data.ok === true);

  // ---- auth ----
  const signup = await call("POST", "/api/auth/signup", {
    email: "test@healingsathi.dev",
    password: "password123",
    name: "Test User",
  });
  check("POST /auth/signup", signup.status === 201 && !!signup.data.accessToken);
  const token = signup.data.accessToken as string;

  const dupe = await call("POST", "/api/auth/signup", {
    email: "test@healingsathi.dev",
    password: "password123",
    name: "Dupe",
  });
  check("signup rejects duplicate email", dupe.status === 409);

  const badLogin = await call("POST", "/api/auth/signin", {
    email: "test@healingsathi.dev",
    password: "wrong-password",
  });
  check("signin rejects wrong password", badLogin.status === 401);

  const signin = await call("POST", "/api/auth/signin", {
    email: "test@healingsathi.dev",
    password: "password123",
  });
  check("POST /auth/signin", signin.status === 200 && !!signin.data.refreshToken);

  const me = await call("GET", "/api/auth/me", undefined, token);
  check("GET /auth/me", me.status === 200 && me.data.user.name === "Test User");

  const unauthed = await call("GET", "/api/auth/me");
  check("me rejects missing token", unauthed.status === 401);

  const refresh = await call("POST", "/api/auth/refresh", { refreshToken: signin.data.refreshToken });
  check("POST /auth/refresh (rotation)", refresh.status === 200 && !!refresh.data.accessToken);

  const reuse = await call("POST", "/api/auth/refresh", { refreshToken: signin.data.refreshToken });
  check("refresh token is single-use", reuse.status === 401);

  // second user for social flows
  const friendSignup = await call("POST", "/api/auth/signup", {
    email: "friend@healingsathi.dev",
    password: "password123",
    name: "Friend User",
  });
  const friendToken = friendSignup.data.accessToken as string;
  const friendId = friendSignup.data.user.id as string;

  // ---- posts ----
  const created = await call("POST", "/api/posts", { title: "Hello", content: "First post!" }, token);
  check("POST /posts", created.status === 201 && created.data.post.content === "First post!");
  const postId = created.data.post.id as string;

  const feed = await call("GET", "/api/posts", undefined, token);
  check("GET /posts feed", feed.status === 200 && feed.data.posts.length === 1);

  const comment = await call("POST", `/api/posts/${postId}/comments`, { text: "Nice one" }, friendToken);
  check("POST /posts/:id/comments", comment.status === 201 && comment.data.commentCount === 1);

  const react = await call("POST", `/api/posts/${postId}/react`, { type: "support" }, friendToken);
  check(
    "react toggles on with authoritative counts",
    react.status === 200 && react.data.active === true && react.data.supportCount === 1,
  );
  const unreact = await call("POST", `/api/posts/${postId}/react`, { type: "support" }, friendToken);
  check("react toggles off", unreact.data.active === false && unreact.data.supportCount === 0);

  // Concurrency: parallel reactions from two users can never double-count either one.
  const [reactA, reactB] = await Promise.all([
    call("POST", `/api/posts/${postId}/react`, { type: "support" }, token),
    call("POST", `/api/posts/${postId}/react`, { type: "support" }, friendToken),
  ]);
  check(
    "parallel reactions from two users both land exactly once",
    reactA.data.active === true && reactB.data.active === true &&
      Math.max(reactA.data.supportCount, reactB.data.supportCount) === 2,
  );

  const save = await call("POST", `/api/posts/${postId}/save`, undefined, friendToken);
  check("save post", save.data.saved === true);
  const savedList = await call("GET", "/api/posts/saved", undefined, friendToken);
  check("GET /posts/saved", savedList.data.posts.length === 1);

  const single = await call("GET", `/api/posts/${postId}`, undefined, token);
  check("GET /posts/:id with comments", single.data.comments.length === 1);

  // ---- groups ----
  const group = await Group.create({ name: "Test Warriors", tag: "Testing" });
  const join = await call("POST", `/api/groups/${group._id}/join`, undefined, token);
  check("join group", join.data.joined === true);
  const groups = await call("GET", "/api/groups", undefined, token);
  check("GET /groups shows joined flag", groups.data.groups[0].joined === true);

  const proposal = await call(
    "POST",
    "/api/groups/request",
    { condition: "POTS", description: "Support group", reason: "Needed" },
    token,
  );
  check("POST /groups/request", proposal.status === 201);

  // ---- chats ----
  const chat = await call("POST", "/api/chats", { withUserId: friendId }, token);
  check("POST /chats (find-or-create)", chat.status === 201 && !!chat.data.chatId);
  const chatId = chat.data.chatId as string;

  const sent = await call("POST", `/api/chats/${chatId}/messages`, { text: "Hey friend!" }, token);
  check("send message", sent.status === 201 && sent.data.message.text === "Hey friend!");

  const messages = await call("GET", `/api/chats/${chatId}/messages`, undefined, friendToken);
  check("friend reads message (mine=false)", messages.data.messages[0].mine === false);

  const chatList = await call("GET", "/api/chats", undefined, friendToken);
  check("GET /chats shows last message", chatList.data.chats[0].last === "Hey friend!");

  // ---- unread counters + message notifications ----
  check("recipient's chat shows unread 1", chatList.data.chats[0].unread === 1);
  const senderChats = await call("GET", "/api/chats", undefined, token);
  check("sender's own unread stays 0", senderChats.data.chats[0].unread === 0);

  const friendNotifs = await call("GET", "/api/notifications", undefined, friendToken);
  const msgNotif = friendNotifs.data.notifications.find((n: any) => n.chatId === chatId);
  check(
    "message lands on the notifications page (type Chats, carries chatId)",
    msgNotif?.type === "Chats" && String(msgNotif?.title).startsWith("New message from"),
  );

  await call("POST", `/api/chats/${chatId}/messages`, { text: "again!" }, token);
  const chatListTwo = await call("GET", "/api/chats", undefined, friendToken);
  check("second message increments unread to 2", chatListTwo.data.chats[0].unread === 2);
  const notifsTwo = await call("GET", "/api/notifications", undefined, friendToken);
  check(
    "repeated messages collapse into ONE unread notification per chat",
    notifsTwo.data.notifications.filter((n: any) => n.chatId === chatId && n.unread).length === 1,
  );

  const markRead = await call("POST", `/api/chats/${chatId}/read`, undefined, friendToken);
  check("POST /chats/:id/read", markRead.status === 200);
  const chatListRead = await call("GET", "/api/chats", undefined, friendToken);
  check("opening the chat zeroes unread", chatListRead.data.chats[0].unread === 0);
  const notifsRead = await call("GET", "/api/notifications", undefined, friendToken);
  check(
    "reading the chat marks its message notification read",
    notifsRead.data.notifications.every((n: any) => n.chatId !== chatId || !n.unread),
  );

  // Chat notifications toggle: off = no notification entries; unread still counts
  // (like a muted chat), and the badge stays honest.
  const prefOff = await call("PATCH", "/api/auth/me", { notifyOnMessages: false }, friendToken);
  check("PATCH /auth/me turns chat notifications off", prefOff.data.user.notifyOnMessages === false);
  await call("POST", `/api/chats/${chatId}/messages`, { text: "silent one" }, token);
  const notifsMuted = await call("GET", "/api/notifications", undefined, friendToken);
  check(
    "no message notification while the toggle is off",
    notifsMuted.data.notifications.every((n: any) => n.chatId !== chatId || !n.unread),
  );
  const chatListMuted = await call("GET", "/api/chats", undefined, friendToken);
  check("unread still counts while notifications are off", chatListMuted.data.chats[0].unread === 1);
  await call("PATCH", "/api/auth/me", { notifyOnMessages: true }, friendToken);
  await call("POST", `/api/chats/${chatId}/read`, undefined, friendToken);

  // ---- realtime chat (Socket.io) ----
  const badSocket = socketClient(base, { auth: { token: "not-a-jwt" }, transports: ["websocket"] });
  const badSocketRejected = await new Promise<boolean>((resolve) => {
    badSocket.on("connect_error", () => resolve(true));
    badSocket.on("connect", () => resolve(false));
    setTimeout(() => resolve(false), 3000);
  });
  badSocket.disconnect();
  check("socket rejects an invalid token", badSocketRejected);

  const friendSocket = socketClient(base, { auth: { token: friendToken }, transports: ["websocket"] });
  let chatUpdated: any = null;
  friendSocket.on("chat:updated", (payload: any) => {
    chatUpdated = payload;
  });
  const liveMessage = await new Promise<any>((resolve) => {
    friendSocket.on("connect", () => friendSocket.emit("chat:join", chatId));
    friendSocket.on("message:new", (payload: any) => resolve(payload));
    // Give the async chat:join membership check a beat before sending.
    setTimeout(() => call("POST", `/api/chats/${chatId}/messages`, { text: "realtime!" }, token), 500);
    setTimeout(() => resolve(null), 5000);
  });
  // chat:updated is a separate packet — give it a beat before disconnecting.
  await new Promise((resolve) => setTimeout(resolve, 500));
  friendSocket.disconnect();
  check(
    "friend receives the message over the socket instantly",
    liveMessage?.chatId === chatId && liveMessage?.message?.text === "realtime!",
  );
  check(
    "chat:updated carries the sender's name (message popup payload)",
    chatUpdated?.chatId === chatId && chatUpdated?.fromName === "Test User",
  );

  // ---- security regression checks ----
  const strangerSignup = await call("POST", "/api/auth/signup", {
    email: "stranger@healingsathi.dev",
    password: "password123",
    name: "Stranger",
  });
  const strangerToken = strangerSignup.data.accessToken as string;
  const strangerId = strangerSignup.data.user.id as string;

  const foreignRead = await call("GET", `/api/chats/${chatId}/messages`, undefined, strangerToken);
  check("stranger cannot read others' conversation", foreignRead.status === 404);

  const foreignWrite = await call("POST", `/api/chats/${chatId}/messages`, { text: "intruding" }, strangerToken);
  check("stranger cannot write into others' conversation", foreignWrite.status === 404);

  const badId = await call("GET", "/api/posts/not-an-object-id", undefined, token);
  check("malformed id returns 404 (not 500)", badId.status === 404);

  const tooLong = await call("POST", "/api/posts", { content: "x".repeat(5001) }, token);
  check("oversized post content rejected", tooLong.status === 400);

  const badEmail = await call("POST", "/api/auth/signup", {
    email: "not-an-email",
    password: "password123",
    name: "Bad Email",
  });
  check("signup rejects invalid email", badEmail.status === 400);

  // ---- sathi ----
  const request = await call("POST", "/api/sathi/requests", { toUserId: friendId }, token);
  check("send sathi request", request.status === 201);

  const incoming = await call("GET", "/api/sathi/requests", undefined, friendToken);
  check("friend sees pending request", incoming.data.requests.length === 1);

  const accept = await call(
    "POST",
    `/api/sathi/requests/${incoming.data.requests[0].id}/respond`,
    { action: "accept" },
    friendToken,
  );
  check("accept sathi request", accept.data.status === "accepted");

  const sathis = await call("GET", "/api/sathi", undefined, token);
  check("friendship is mutual", sathis.data.sathis.length === 1);

  const dupRequest = await call("POST", "/api/sathi/requests", { toUserId: friendId }, token);
  check("request to an existing sathi returns 409", dupRequest.status === 409);

  // decline → re-request must land back in the recipient's pending list
  await call("POST", "/api/sathi/requests", { toUserId: strangerId }, token);
  const strangerIncoming = await call("GET", "/api/sathi/requests", undefined, strangerToken);
  const declineId = strangerIncoming.data.requests[0].id as string;
  const decline = await call("POST", `/api/sathi/requests/${declineId}/respond`, { action: "decline" }, strangerToken);
  check("decline sathi request", decline.data.status === "declined");

  const resend = await call("POST", "/api/sathi/requests", { toUserId: strangerId }, token);
  check("re-request after decline works", resend.status === 201);
  const strangerIncoming2 = await call("GET", "/api/sathi/requests", undefined, strangerToken);
  check("re-request is pending again for recipient", strangerIncoming2.data.requests.length === 1);

  // ---- notifications ----
  const notifications = await call("GET", "/api/notifications", undefined, friendToken);
  check("sathi request created a notification", notifications.data.notifications.length >= 1);

  const readAll = await call("POST", "/api/notifications/read-all", undefined, friendToken);
  check("mark all read", readAll.data.ok === true);

  // ---- consultants & bookings ----
  const consultant = await Consultant.create({ name: "Dr. Test", role: "Psychologist" });

  const booking = await call(
    "POST",
    "/api/bookings",
    { consultantId: consultant._id.toString(), date: "Tue 11", time: "3:00 PM" },
    token,
  );
  check("POST /bookings", booking.status === 201 && booking.data.status === "confirmed");

  const bookings = await call("GET", "/api/bookings", undefined, token);
  check("GET /bookings", bookings.data.bookings[0].consultant === "Dr. Test");

  // ---- tips ----
  await HealthTip.create({ title: "Pace yourself", authorName: "Dr. Test", condition: "Fibromyalgia" });
  const tips = await call("GET", "/api/tips?condition=Fibromyalgia", undefined, token);
  check("GET /tips with condition filter", tips.data.tips.length === 1);

  // ---- user search & relations ----
  const searchSathi = await call("GET", "/api/users/search?q=Friend", undefined, token);
  check(
    "search finds a user with sathi relation",
    searchSathi.status === 200 && searchSathi.data.users[0]?.relation === "sathi",
  );

  const searchPending = await call("GET", "/api/users/search?q=Stranger", undefined, token);
  check(
    "search shows pending relation for a sent request",
    searchPending.data.users[0]?.relation === "pending",
  );

  const searchSelf = await call("GET", "/api/users/search?q=Test User", undefined, token);
  check("search never returns yourself", searchSelf.data.users.length === 0);

  // ---- blocking ----
  const block = await call("POST", `/api/users/${strangerId}/block`, undefined, token);
  check("block user", block.status === 200);

  const searchBlocked = await call("GET", "/api/users/search?q=Stranger", undefined, token);
  check("blocked user is hidden from search", searchBlocked.data.users.length === 0);

  const chatBlocked = await call("POST", "/api/chats", { withUserId: strangerId }, token);
  check("can't open a chat with a blocked user", chatBlocked.status === 404);

  const requestBlocked = await call("POST", "/api/sathi/requests", { toUserId: signup.data.user.id }, strangerToken);
  check("blocked user can't send a sathi request back", requestBlocked.status === 404);

  const blockedList = await call("GET", "/api/users/blocked", undefined, token);
  check("GET /users/blocked lists the user", blockedList.data.users.length === 1);

  const unblock = await call("POST", `/api/users/${strangerId}/unblock`, undefined, token);
  check("unblock user", unblock.status === 200);
  const searchUnblocked = await call("GET", "/api/users/search?q=Stranger", undefined, token);
  check("unblocked user is searchable again", searchUnblocked.data.users.length === 1);

  // ---- feed scoping (social graph forms the feed) ----
  const lonerSignup = await call("POST", "/api/auth/signup", {
    email: "loner@healingsathi.dev",
    password: "password123",
    name: "Loner",
  });
  const lonerToken = lonerSignup.data.accessToken as string;
  const lonerFeed = await call("GET", "/api/posts", undefined, lonerToken);
  check("new user with no connections sees an empty feed", lonerFeed.data.posts.length === 0);

  const sathiFeed = await call("GET", "/api/posts", undefined, friendToken);
  check("sathi sees their friend's post in the feed", sathiFeed.data.posts.some((p: any) => p.id === postId));

  // ---- forgot / reset password ----
  const forgot = await call("POST", "/api/auth/forgot-password", { email: "test@healingsathi.dev" });
  check("forgot-password returns a dev code outside production", forgot.status === 200 && /^\d{6}$/.test(forgot.data.devCode));

  const forgotUnknown = await call("POST", "/api/auth/forgot-password", { email: "ghost@healingsathi.dev" });
  check("forgot-password doesn't reveal unknown emails", forgotUnknown.status === 200 && !forgotUnknown.data.devCode);

  const badReset = await call("POST", "/api/auth/reset-password", {
    email: "test@healingsathi.dev",
    code: "000000",
    newPassword: "password456",
  });
  check("reset rejects a wrong code", badReset.status === 400);

  const reset = await call("POST", "/api/auth/reset-password", {
    email: "test@healingsathi.dev",
    code: forgot.data.devCode,
    newPassword: "password456",
  });
  check("reset-password with the emailed code", reset.status === 200);

  const oldPwSignin = await call("POST", "/api/auth/signin", {
    email: "test@healingsathi.dev",
    password: "password123",
  });
  check("old password no longer works after reset", oldPwSignin.status === 401);

  const newPwSignin = await call("POST", "/api/auth/signin", {
    email: "test@healingsathi.dev",
    password: "password456",
  });
  check("new password works after reset", newPwSignin.status === 200);
  const token2 = newPwSignin.data.accessToken as string;
  const refreshToken2 = newPwSignin.data.refreshToken as string;

  // ---- change password / change email ----
  const wrongChange = await call(
    "POST",
    "/api/auth/change-password",
    { currentPassword: "wrong", newPassword: "password789" },
    token2,
  );
  check("change-password rejects a wrong current password", wrongChange.status === 401);

  const change = await call(
    "POST",
    "/api/auth/change-password",
    { currentPassword: "password456", newPassword: "password789", refreshToken: refreshToken2 },
    token2,
  );
  check("change-password", change.status === 200);

  const keptSession = await call("POST", "/api/auth/refresh", { refreshToken: refreshToken2 });
  check("calling device's session survives a password change", keptSession.status === 200);

  const emailWrongPw = await call(
    "POST",
    "/api/auth/change-email",
    { newEmail: "renamed@healingsathi.dev", password: "wrong" },
    token2,
  );
  check("change-email rejects a wrong password", emailWrongPw.status === 401);

  const emailTaken = await call(
    "POST",
    "/api/auth/change-email",
    { newEmail: "friend@healingsathi.dev", password: "password789" },
    token2,
  );
  check("change-email rejects a taken email", emailTaken.status === 409);

  const emailChange = await call(
    "POST",
    "/api/auth/change-email",
    { newEmail: "renamed@healingsathi.dev", password: "password789" },
    token2,
  );
  check("change-email", emailChange.status === 200 && emailChange.data.user.email === "renamed@healingsathi.dev");

  // ---- passwordless sign-in (email code) ----
  const codeRequest = await call("POST", "/api/auth/email-code/request", { email: "renamed@healingsathi.dev" });
  check("email-code request returns dev code without SMTP", /^\d{6}$/.test(codeRequest.data.devCode));

  const codeRequestGhost = await call("POST", "/api/auth/email-code/request", { email: "nobody@healingsathi.dev" });
  check("email-code request doesn't reveal unknown emails", codeRequestGhost.status === 200 && !codeRequestGhost.data.devCode);

  const badVerify = await call("POST", "/api/auth/email-code/verify", { email: "renamed@healingsathi.dev", code: "000000" });
  check("email-code verify rejects a wrong code", badVerify.status === 400);

  const verify = await call("POST", "/api/auth/email-code/verify", {
    email: "renamed@healingsathi.dev",
    code: codeRequest.data.devCode,
  });
  check("email-code verify signs the user in", verify.status === 200 && !!verify.data.accessToken);

  const reusedCode = await call("POST", "/api/auth/email-code/verify", {
    email: "renamed@healingsathi.dev",
    code: codeRequest.data.devCode,
  });
  check("sign-in codes are single-use", reusedCode.status === 400);

  // ---- google sign-in (config gate) ----
  const google = await call("POST", "/api/auth/google", { idToken: "fake-token" });
  check("google sign-in answers 501 while unconfigured", google.status === 501);

  // ---- multi-destination posts ----
  const multi = await call(
    "POST",
    "/api/posts",
    { title: "Everywhere", content: "Feed and group at once", toFeed: true, groupIds: [group._id.toString()], image: "data:image/png;base64,iVBORw0KGgo=" },
    token2,
  );
  check(
    "post lands in feed + group simultaneously",
    multi.status === 201 && multi.data.posts.length === 2 && !!multi.data.posts[0].image,
  );

  const foreignGroupPost = await call(
    "POST",
    "/api/posts",
    { content: "sneaking in", groupIds: [group._id.toString()] },
    strangerToken,
  );
  check("can't post into a group you haven't joined", foreignGroupPost.status === 403);

  // ---- multi-photo posts (carousel) ----
  const px = (n: number) => `data:image/png;base64,iVBORw0KGgo${n}=`;
  const carouselPost = await call(
    "POST",
    "/api/posts",
    { title: "Trip", content: "Three photos", images: [px(1), px(2), px(3)] },
    token2,
  );
  check(
    "post carries all photos (images[]) with image = the first",
    carouselPost.status === 201 &&
      carouselPost.data.post.images.length === 3 &&
      carouselPost.data.post.image === px(1),
  );

  const tooManyPhotos = await call(
    "POST",
    "/api/posts",
    { content: "album dump", images: Array.from({ length: 11 }, (_, i) => px(i)) },
    token2,
  );
  check("more than 10 photos per post is rejected", tooManyPhotos.status === 400);

  const legacyImagePost = await call(
    "POST",
    "/api/posts",
    { content: "old client", image: px(9) },
    token2,
  );
  check(
    "legacy single-image posts surface as a one-photo carousel",
    legacyImagePost.data.post.images.length === 1 && legacyImagePost.data.post.image === px(9),
  );

  // ---- consultant applications ----
  const apply = await call(
    "POST",
    "/api/consultants/apply",
    { fullName: "Dr. Test User", specialty: "Psychiatry", credentials: "MBBS, MD", yearsExperience: 8, languages: ["English"] },
    token2,
  );
  check("POST /consultants/apply", apply.status === 201 && apply.data.application.status === "pending");

  const applyDupe = await call(
    "POST",
    "/api/consultants/apply",
    { fullName: "Dr. Test User", specialty: "Psychiatry", credentials: "MBBS, MD" },
    token2,
  );
  check("duplicate application rejected while pending", applyDupe.status === 409);

  const myApplication = await call("GET", "/api/consultants/apply", undefined, token2);
  check("GET /consultants/apply", myApplication.data.application?.specialty === "Psychiatry");

  // ---- photo chat messages ----
  const photoMsg = await call(
    "POST",
    `/api/chats/${chatId}/messages`,
    { image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" },
    token2,
  );
  check("photo-only chat message", photoMsg.status === 201 && !!photoMsg.data.message.image);

  const emptyMsg = await call("POST", `/api/chats/${chatId}/messages`, {}, token2);
  check("empty chat message rejected", emptyMsg.status === 400);

  const photoThread = await call("GET", `/api/chats/${chatId}/messages`, undefined, friendToken);
  check(
    "photo travels to the other participant",
    !!photoThread.data.messages[photoThread.data.messages.length - 1].image,
  );

  const chatPreview = await call("GET", "/api/chats", undefined, friendToken);
  check("photo message previews as 📷 Photo", chatPreview.data.chats[0].last === "📷 Photo");

  // ---- sharing a post into a chat (post card, not a link) ----
  const shareMsg = await call(
    "POST",
    `/api/chats/${chatId}/messages`,
    { sharedPostId: postId },
    token2,
  );
  check(
    "sharing a post sends a structured post card",
    shareMsg.status === 201 && shareMsg.data.message.sharedPost?.id === postId,
  );

  const sharedThread = await call("GET", `/api/chats/${chatId}/messages`, undefined, friendToken);
  const receivedShare = sharedThread.data.messages[sharedThread.data.messages.length - 1];
  check(
    "recipient gets the full card (author + content) to open the post from",
    receivedShare.sharedPost?.id === postId && !!receivedShare.sharedPost?.author,
  );

  const sharePreview = await call("GET", "/api/chats", undefined, friendToken);
  check("shared post previews as 📄 Shared a post", sharePreview.data.chats[0].last === "📄 Shared a post");

  const shareGhost = await call(
    "POST",
    `/api/chats/${chatId}/messages`,
    { sharedPostId: "656565656565656565656565" },
    token2,
  );
  check("sharing a deleted post is rejected", shareGhost.status === 404);

  // ---- group members ----
  const membersRes = await call("GET", `/api/groups/${group._id}/members`, undefined, token2);
  check(
    "GET /groups/:id/members",
    membersRes.status === 200 && membersRes.data.members.some((m: any) => m.name === "Test User"),
  );

  // ---- threaded comment replies ----
  const parentThread = await call("GET", `/api/posts/${postId}`, undefined, token2);
  const parentCommentId = parentThread.data.comments[0].id as string;

  const reply = await call(
    "POST",
    `/api/posts/${postId}/comments`,
    { text: "Replying!", parentId: parentCommentId },
    token2,
  );
  check(
    "threaded reply returns the created comment",
    reply.status === 201 && reply.data.comment.parentId === parentCommentId,
  );

  const orphanReply = await call(
    "POST",
    `/api/posts/${postId}/comments`,
    { text: "orphan", parentId: "656565656565656565656565" },
    token2,
  );
  check("reply to a missing comment is rejected", orphanReply.status === 404);

  const threadAfter = await call("GET", `/api/posts/${postId}`, undefined, token2);
  check(
    "thread carries the reply's parentId",
    threadAfter.data.comments.some((c: any) => c.parentId === parentCommentId),
  );

  // ---- likes on comments ----
  const likeComment = await call(
    "POST",
    `/api/posts/${postId}/comments/${parentCommentId}/support`,
    undefined,
    token2,
  );
  check(
    "comment support toggles on with a count",
    likeComment.status === 200 && likeComment.data.active === true && likeComment.data.supportCount === 1,
  );

  const commentState = await call("GET", `/api/posts/${postId}`, undefined, token2);
  const likedComment = commentState.data.comments.find((c: any) => c.id === parentCommentId);
  check(
    "thread exposes comment supportCount + supportedByMe",
    likedComment.supportCount === 1 && likedComment.supportedByMe === true,
  );

  const unlikeComment = await call(
    "POST",
    `/api/posts/${postId}/comments/${parentCommentId}/support`,
    undefined,
    token2,
  );
  check("comment support toggles off", unlikeComment.data.active === false && unlikeComment.data.supportCount === 0);

  const likeGhostComment = await call(
    "POST",
    `/api/posts/${postId}/comments/656565656565656565656565/support`,
    undefined,
    token2,
  );
  check("supporting a missing comment 404s", likeGhostComment.status === 404);

  // ---- admin moderation (superuser review queue) ----
  const memberBlocked = await call("GET", "/api/admin/reviews", undefined, token2);
  check("member cannot access the admin review queue", memberBlocked.status === 403);

  await User.create({
    email: "admin@healingsathi.dev",
    passwordHash: await bcrypt.hash("password123", 10),
    name: "Admin",
    role: "admin",
  });
  const adminSignin = await call("POST", "/api/auth/signin", {
    email: "admin@healingsathi.dev",
    password: "password123",
  });
  const adminToken = adminSignin.data.accessToken as string;
  check("admin role travels in the auth payload", adminSignin.data.user.role === "admin");

  const reviews = await call("GET", "/api/admin/reviews", undefined, adminToken);
  check(
    "review queue lists the pending proposal + application",
    reviews.status === 200 &&
      reviews.data.groupProposals.length === 1 &&
      reviews.data.consultantApplications.length === 1,
  );

  const approveGroup = await call(
    "POST",
    `/api/admin/group-proposals/${reviews.data.groupProposals[0].id}/approve`,
    {},
    adminToken,
  );
  check("approve group proposal", approveGroup.status === 200 && approveGroup.data.name === "POTS");

  const groupsAfter = await call("GET", "/api/groups", undefined, token2);
  const pots = groupsAfter.data.groups.find((g: any) => g.name === "POTS");
  check("approved group is publicly listed with the proposer as first member", pots?.joined === true && pots?.memberCount === 1);

  const approveAgain = await call(
    "POST",
    `/api/admin/group-proposals/${reviews.data.groupProposals[0].id}/approve`,
    {},
    adminToken,
  );
  check("re-approving a decided proposal 404s", approveAgain.status === 404);

  const approveApp = await call(
    "POST",
    `/api/admin/consultant-applications/${reviews.data.consultantApplications[0].id}/approve`,
    undefined,
    adminToken,
  );
  check("approve consultant application", approveApp.status === 200 && !!approveApp.data.consultantId);

  const consultantsAfter = await call("GET", "/api/consultants", undefined, token2);
  check(
    "approved consultant appears in the public directory",
    consultantsAfter.data.consultants.some((c: any) => c.name === "Dr. Test User"),
  );

  const appAfter = await call("GET", "/api/consultants/apply", undefined, token2);
  check("applicant sees the approved status", appAfter.data.application.status === "approved");

  const applicantNotifs = await call("GET", "/api/notifications", undefined, token2);
  check(
    "applicant is notified of the approval",
    applicantNotifs.data.notifications.some((n: any) => n.title.includes("approved as a consultant")),
  );

  // rejection path: a fresh proposal that never goes public
  await call("POST", "/api/groups/request", { condition: "EDS", description: "d", reason: "r" }, friendToken);
  const reviews2 = await call("GET", "/api/admin/reviews", undefined, adminToken);
  const rejectGroup = await call(
    "POST",
    `/api/admin/group-proposals/${reviews2.data.groupProposals[0].id}/reject`,
    {},
    adminToken,
  );
  check("reject group proposal", rejectGroup.status === 200);
  const groupsAfterReject = await call("GET", "/api/groups", undefined, token2);
  check(
    "rejected proposal never goes public",
    !groupsAfterReject.data.groups.some((g: any) => g.name.startsWith("EDS")),
  );

  // ---- public profiles ----
  const profile = await call("GET", `/api/users/${friendId}/profile`, undefined, token2);
  check(
    "GET /users/:id/profile (relation + member-since)",
    profile.status === 200 && profile.data.user.relation === "sathi" && !!profile.data.user.memberSince,
  );
  check(
    "profile shows the posts they've supported",
    profile.data.likedPosts.some((p: any) => p.id === postId),
  );

  const selfProfile = await call("GET", `/api/users/${signup.data.user.id}/profile`, undefined, token2);
  check("own profile reports relation self", selfProfile.data.user.relation === "self");

  // ---- becoming sathis adds the chat ----
  const patA = await call("POST", "/api/auth/signup", { email: "pat.a@healingsathi.dev", password: "password123", name: "Pat A" });
  const patB = await call("POST", "/api/auth/signup", { email: "pat.b@healingsathi.dev", password: "password123", name: "Pat B" });
  await call("POST", "/api/sathi/requests", { toUserId: patB.data.user.id }, patA.data.accessToken);
  const patPending = await call("GET", "/api/sathi/requests", undefined, patB.data.accessToken);
  await call(
    "POST",
    `/api/sathi/requests/${patPending.data.requests[0].id}/respond`,
    { action: "accept" },
    patB.data.accessToken,
  );
  const patAChats = await call("GET", "/api/chats", undefined, patA.data.accessToken);
  check(
    "accepting a sathi request puts the chat in both lists",
    patAChats.data.chats.some((c: any) => c.name === "Pat B" && !!c.userId),
  );

  // ---- condition-based feed discovery ----
  const migraineGroup = await Group.create({ name: "Migraine Support", tag: "Migraine" });
  await call("PATCH", "/api/auth/me", { conditions: ["Migraine"] }, patB.data.accessToken);
  const peerPost = await call("POST", "/api/posts", { title: "Aura", content: "Anyone else get auras?" }, patB.data.accessToken);
  await call("POST", `/api/groups/${migraineGroup._id}/join`, undefined, patB.data.accessToken);
  const conditionGroupPost = await call(
    "POST",
    "/api/posts",
    { content: "Group-only migraine tip", groupIds: [migraineGroup._id.toString()] },
    patB.data.accessToken,
  );

  // The loner (still zero connections) sets the condition — the feed lights up.
  await call("PATCH", "/api/auth/me", { conditions: ["Migraine"] }, lonerToken);
  const discoveryFeed = await call("GET", "/api/posts", undefined, lonerToken);
  check(
    "feed surfaces public posts from same-condition people",
    discoveryFeed.data.posts.some((p: any) => p.id === peerPost.data.post.id),
  );
  check(
    "feed surfaces posts in condition-matching groups without joining",
    discoveryFeed.data.posts.some((p: any) => p.id === conditionGroupPost.data.post.id),
  );

  // ---- edit & delete own content ----
  const editable = await call("POST", "/api/posts", { title: "Before", content: "first draft" }, token);
  const editableId = editable.data.post.id as string;

  const foreignEdit = await call("PATCH", `/api/posts/${editableId}`, { content: "hijack" }, strangerToken);
  check("editing someone else's post 404s", foreignEdit.status === 404);
  const edited = await call("PATCH", `/api/posts/${editableId}`, { title: "After", content: "second draft" }, token);
  check(
    "author edits their own post",
    edited.status === 200 && edited.data.post.title === "After" && edited.data.post.content === "second draft",
  );

  const rootComment = await call("POST", `/api/posts/${editableId}/comments`, { text: "root" }, friendToken);
  const rootCommentId = rootComment.data.comment.id as string;
  await call("POST", `/api/posts/${editableId}/comments`, { text: "child reply", parentId: rootCommentId }, token);

  const foreignCommentDelete = await call(
    "DELETE",
    `/api/posts/${editableId}/comments/${rootCommentId}`,
    undefined,
    strangerToken,
  );
  check("stranger cannot delete a comment", foreignCommentDelete.status === 403);
  const cascadeDelete = await call(
    "DELETE",
    `/api/posts/${editableId}/comments/${rootCommentId}`,
    undefined,
    friendToken,
  );
  check(
    "comment author deletes their comment — replies cascade",
    cascadeDelete.status === 200 && cascadeDelete.data.commentCount === 0,
  );

  const moderated = await call("POST", `/api/posts/${editableId}/comments`, { text: "to be moderated" }, friendToken);
  const moderatorDelete = await call(
    "DELETE",
    `/api/posts/${editableId}/comments/${moderated.data.comment.id}`,
    undefined,
    token,
  );
  check("post author can remove a comment on their own post", moderatorDelete.status === 200);

  const foreignPostDelete = await call("DELETE", `/api/posts/${editableId}`, undefined, strangerToken);
  check("deleting someone else's post 404s", foreignPostDelete.status === 404);
  await call("POST", `/api/posts/${editableId}/save`, undefined, friendToken); // saved-list cleanup proof
  const ownPostDelete = await call("DELETE", `/api/posts/${editableId}`, undefined, token);
  check("author deletes their own post", ownPostDelete.status === 200);
  const deletedFetch = await call("GET", `/api/posts/${editableId}`, undefined, token);
  check("deleted post is gone", deletedFetch.status === 404);
  const friendSaved = await call("GET", "/api/posts/saved", undefined, friendToken);
  check(
    "deleted post leaves everyone's saved list",
    friendSaved.data.posts.every((p: any) => p.id !== editableId),
  );

  // ---- account deletion (DELETE /auth/me) ----
  const doomed = await call("POST", "/api/auth/signup", {
    email: "doomed@healingsathi.dev",
    password: "password123",
    name: "Doomed User",
  });
  const doomedToken = doomed.data.accessToken as string;
  const doomedId = doomed.data.user.id as string;

  // Leave traces everywhere: an own post, a comment + reaction on someone else's
  // post, and a conversation with the main user.
  const doomedPost = await call("POST", "/api/posts", { content: "I will vanish" }, doomedToken);
  const doomedPostId = doomedPost.data.post.id as string;
  await call("POST", `/api/posts/${postId}/comments`, { text: "vanish too" }, doomedToken);
  await call("POST", `/api/posts/${postId}/react`, { type: "support" }, doomedToken);
  const doomedChat = await call("POST", "/api/chats", { withUserId: doomedId }, token);
  await call("POST", `/api/chats/${doomedChat.data.chatId}/messages`, { text: "hi doomed" }, token);

  const missingReason = await call("DELETE", "/api/auth/me", { password: "password123" }, doomedToken);
  check("delete requires an exit reason", missingReason.status === 400);
  const wrongPassword = await call(
    "DELETE",
    "/api/auth/me",
    { password: "not-the-password", reason: "Something else" },
    doomedToken,
  );
  check("delete rejects a wrong password", wrongPassword.status === 401);

  const erased = await call(
    "DELETE",
    "/api/auth/me",
    { password: "password123", reason: "Privacy concerns", feedback: "loved it, moving on" },
    doomedToken,
  );
  check("DELETE /auth/me erases the account", erased.status === 200 && erased.data.ok === true);
  const exitRecords = await ExitFeedbackModel.find({ reason: "Privacy concerns" });
  check(
    "exit reason + feedback stored anonymously",
    exitRecords.length === 1 && exitRecords[0].details === "loved it, moving on",
  );

  const ghostSignin = await call("POST", "/api/auth/signin", {
    email: "doomed@healingsathi.dev",
    password: "password123",
  });
  check("deleted account can no longer sign in", ghostSignin.status === 401);

  const ghostPost = await call("GET", `/api/posts/${doomedPostId}`, undefined, token);
  check("their posts are gone", ghostPost.status === 404);
  const cleanedThread = await call("GET", `/api/posts/${postId}`, undefined, token);
  check(
    "their comments on other posts are removed",
    cleanedThread.data.comments.every((c: any) => c.text !== "vanish too"),
  );
  const chatsAfterDelete = await call("GET", "/api/chats", undefined, token);
  check(
    "the conversation disappears for the other side too",
    chatsAfterDelete.data.chats.every((c: any) => c.id !== doomedChat.data.chatId),
  );

  // ---- teardown ----
  realtime.close(); // also closes the underlying http server
  server.close();
  await mongoose.disconnect();
  await mongo.stop();

  console.log(results.join("\n"));
  console.log(`\n${passed}/${passed} checks passed ✓`);
};

run().catch((err) => {
  console.error(results.join("\n"));
  console.error("Test run crashed:", err);
  process.exit(1);
});
