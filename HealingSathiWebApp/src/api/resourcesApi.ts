import { http } from "./http";

/**
 * Live-data API for every screen, ready to wire in when the backend is running.
 *
 * The app currently renders local dummy data everywhere (demo mode — works offline).
 * To flip a screen to live data, call these inside a useEffect and replace the local
 * array. Example for HomeScreen:
 *
 *   const [posts, setPosts] = useState(dummyPosts);
 *   useEffect(() => {
 *     resourcesApi.getFeed()
 *       .then(setPosts)
 *       .catch(() => {}); // backend offline → keep dummy data (demo mode)
 *   }, []);
 *
 * Full endpoint reference: HealingSathiBackend/ARCHITECTURE.md
 */
export const resourcesApi = {
  // Posts
  getFeed: async (groupId?: string) =>
    (await http.get("/posts", { params: { groupId } })).data.posts,
  getMyPosts: async () => (await http.get("/posts", { params: { mine: 1 } })).data.posts,
  getSavedPosts: async () => (await http.get("/posts/saved")).data.posts,
  // Multi-destination: `toFeed` posts to the personal feed, `groupIds` to any joined
  // groups — one post per destination. `images` carries up to 10 base64 data-URI
  // photos (swipeable carousel; MVP transport until cloud storage lands).
  // Returns every created copy.
  createPost: async (body: {
    title?: string;
    content: string;
    groupId?: string;
    groupIds?: string[];
    toFeed?: boolean;
    image?: string;
    images?: string[];
    tags?: string[];
    contentWarning?: boolean;
  }) => (await http.post("/posts", body)).data.posts,
  getPost: async (id: string) => (await http.get(`/posts/${id}`)).data,
  // Author-only edit (title/content); destination and photos stay fixed.
  updatePost: async (postId: string, body: { title?: string; content?: string; contentWarning?: boolean }) =>
    (await http.patch(`/posts/${postId}`, body)).data.post,
  // Author-only delete; the backend also drops it from everyone's saved list.
  deletePost: async (postId: string) => (await http.delete(`/posts/${postId}`)).data,
  addComment: async (postId: string, text: string, parentId?: string) =>
    (await http.post(`/posts/${postId}/comments`, { text, parentId })).data,
  // Own comments (or any comment on your own post) — replies go with it.
  deleteComment: async (postId: string, commentId: string) =>
    (await http.delete(`/posts/${postId}/comments/${commentId}`)).data,
  // Both reaction endpoints answer with the authoritative state + counts
  // (concurrency-safe on the server), so optimistic UI reconciles instantly.
  reactToPost: async (postId: string, type: "support" | "helpful") =>
    (await http.post(`/posts/${postId}/react`, { type })).data,
  reactToComment: async (postId: string, commentId: string) =>
    (await http.post(`/posts/${postId}/comments/${commentId}/support`)).data,
  toggleSavePost: async (postId: string) => (await http.post(`/posts/${postId}/save`)).data,

  // Groups
  getGroups: async () => (await http.get("/groups")).data.groups,
  getGroupMembers: async (groupId: string) =>
    (await http.get(`/groups/${groupId}/members`)).data.members,
  toggleJoinGroup: async (groupId: string) => (await http.post(`/groups/${groupId}/join`)).data,
  requestGroup: async (body: { condition: string; description: string; population?: string; reason: string; references?: string }) =>
    (await http.post("/groups/request", body)).data,

  // Chats (REST polling for now; sockets are on the roadmap)
  getChats: async () => (await http.get("/chats")).data.chats,
  openChatWith: async (withUserId: string) => (await http.post("/chats", { withUserId })).data.chatId,
  getMessages: async (chatId: string) => (await http.get(`/chats/${chatId}/messages`)).data.messages,
  // A message carries text, a photo (base64 data-URI), and/or a shared post
  // (sharedPostId → the other side receives a tappable post card).
  sendMessage: async (chatId: string, body: { text?: string; image?: string; sharedPostId?: string; diyaId?: string }) =>
    (await http.post(`/chats/${chatId}/messages`, body)).data.message,
  // Opening a chat zeroes its unread counter (feeds the Chats-tab badge).
  markChatRead: async (chatId: string) => (await http.post(`/chats/${chatId}/read`)).data,

  // Sathi (friends)
  getSathis: async () => (await http.get("/sathi")).data.sathis,
  getSathiRequests: async () => (await http.get("/sathi/requests")).data.requests,
  sendSathiRequest: async (toUserId: string) => (await http.post("/sathi/requests", { toUserId })).data,
  respondToSathiRequest: async (requestId: string, action: "accept" | "decline") =>
    (await http.post(`/sathi/requests/${requestId}/respond`, { action })).data,

  // People (search + block list + public profiles)
  searchUsers: async (q: string) => (await http.get("/users/search", { params: { q } })).data.users,
  // Read-only public profile: who they are, member-since, their posts + liked posts.
  getUserProfile: async (userId: string) => (await http.get(`/users/${userId}/profile`)).data,
  getBlockedUsers: async () => (await http.get("/users/blocked")).data.users,
  blockUser: async (userId: string) => (await http.post(`/users/${userId}/block`)).data,
  unblockUser: async (userId: string) => (await http.post(`/users/${userId}/unblock`)).data,

  // Consultant applications ("Join as a consultant")
  applyAsConsultant: async (body: {
    fullName: string;
    specialty: string;
    credentials: string;
    licenseNumber?: string;
    yearsExperience?: number;
    bio?: string;
    languages?: string[];
  }) => (await http.post("/consultants/apply", body)).data.application,
  getMyConsultantApplication: async () => (await http.get("/consultants/apply")).data.application,

  // Notifications
  getNotifications: async () => (await http.get("/notifications")).data.notifications,
  markAllNotificationsRead: async () => (await http.post("/notifications/read-all")).data,

  // Consultants & bookings
  getConsultants: async () => (await http.get("/consultants")).data.consultants,
  createBooking: async (body: { consultantId: string; sessionType?: string; date: string; time: string; note?: string }) =>
    (await http.post("/bookings", body)).data,
  getMyBookings: async () => (await http.get("/bookings")).data.bookings,

  // Health tips
  getHealthTips: async (condition?: string) =>
    (await http.get("/tips", { params: { condition } })).data.tips,
  getHealthTip: async (id: string) => (await http.get(`/tips/${id}`)).data.tip,
  getTipComments: async (id: string) => (await http.get(`/tips/${id}/comments`)).data.comments,
  addTipComment: async (id: string, text: string) =>
    (await http.post(`/tips/${id}/comments`, { text })).data.comment,
  deleteTipComment: async (commentId: string) =>
    (await http.delete(`/tips/comments/${commentId}`)).data,

  // Healing Habits — the daily checklist + Healing Points (gamification)
  getHabitsToday: async () => (await http.get("/habits/today")).data,
  toggleHabit: async (taskKey: string) => (await http.post("/habits/toggle", { taskKey })).data,
  getHabitsCircle: async () => (await http.get("/habits/circle")).data.circle,
  cheerHabits: async (userId: string) => (await http.post(`/habits/${userId}/cheer`)).data,
  setGroupCover: async (groupId: string, coverUrl: string | null) =>
    (await http.patch(`/groups/${groupId}/cover`, { coverUrl })).data,

  // E2EE Healing Diary — the server only ever sees ciphertext blobs
  getDiary: async () => (await http.get("/diary")).data,
  setupDiary: async (meta: { salt: string; checkCiphertext: string; checkIv: string }) =>
    (await http.post("/diary/meta", meta)).data.meta,
  addDiaryEntry: async (blob: { ciphertext: string; iv: string }) =>
    (await http.post("/diary/entries", blob)).data.entry,
  updateDiaryEntry: async (id: string, blob: { ciphertext: string; iv: string }) =>
    (await http.patch(`/diary/entries/${id}`, blob)).data.entry,
  deleteDiaryEntry: async (id: string) => (await http.delete(`/diary/entries/${id}`)).data,

  getCommentedPosts: async () => (await http.get("/posts/commented")).data.posts,

  // Diya — the daily check-in ritual (mood + optional thought/photo, sathi-visible)
  getDiyas: async () => (await http.get("/diyas")).data,
  lightDiya: async (body: { mood: string; note?: string; photo?: string | null }) =>
    (await http.post("/diyas", body)).data,
  supportDiya: async (id: string) => (await http.post(`/diyas/${id}/support`)).data,

  // Admin review queue (role "admin" only): group proposals + consultant applications
  getAdminReviews: async () => (await http.get("/admin/reviews")).data,
  approveGroupProposal: async (id: string, body?: { name?: string; tag?: string }) =>
    (await http.post(`/admin/group-proposals/${id}/approve`, body ?? {})).data,
  rejectGroupProposal: async (id: string, reason?: string) =>
    (await http.post(`/admin/group-proposals/${id}/reject`, { reason })).data,
  approveConsultantApplication: async (id: string) =>
    (await http.post(`/admin/consultant-applications/${id}/approve`)).data,
  rejectConsultantApplication: async (id: string, reason?: string) =>
    (await http.post(`/admin/consultant-applications/${id}/reject`, { reason })).data,
};
