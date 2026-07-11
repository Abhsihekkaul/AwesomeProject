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
  createPost: async (body: { title?: string; content: string; groupId?: string; tags?: string[]; contentWarning?: boolean }) =>
    (await http.post("/posts", body)).data.post,
  getPost: async (id: string) => (await http.get(`/posts/${id}`)).data,
  addComment: async (postId: string, text: string, parentId?: string) =>
    (await http.post(`/posts/${postId}/comments`, { text, parentId })).data,
  reactToPost: async (postId: string, type: "support" | "helpful") =>
    (await http.post(`/posts/${postId}/react`, { type })).data,
  toggleSavePost: async (postId: string) => (await http.post(`/posts/${postId}/save`)).data,

  // Groups
  getGroups: async () => (await http.get("/groups")).data.groups,
  toggleJoinGroup: async (groupId: string) => (await http.post(`/groups/${groupId}/join`)).data,
  requestGroup: async (body: { condition: string; description: string; population?: string; reason: string; references?: string }) =>
    (await http.post("/groups/request", body)).data,

  // Chats (REST polling for now; sockets are on the roadmap)
  getChats: async () => (await http.get("/chats")).data.chats,
  openChatWith: async (withUserId: string) => (await http.post("/chats", { withUserId })).data.chatId,
  getMessages: async (chatId: string) => (await http.get(`/chats/${chatId}/messages`)).data.messages,
  sendMessage: async (chatId: string, text: string) =>
    (await http.post(`/chats/${chatId}/messages`, { text })).data.message,

  // Sathi (friends)
  getSathis: async () => (await http.get("/sathi")).data.sathis,
  getSathiRequests: async () => (await http.get("/sathi/requests")).data.requests,
  sendSathiRequest: async (toUserId: string) => (await http.post("/sathi/requests", { toUserId })).data,
  respondToSathiRequest: async (requestId: string, action: "accept" | "decline") =>
    (await http.post(`/sathi/requests/${requestId}/respond`, { action })).data,

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
};
