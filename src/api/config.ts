import { Platform } from "react-native";

// Local dev backend (HealingSathiBackend, `npm run dev`, default port 4000).
// Android emulators can't reach the host machine via `localhost` — they need the special
// `10.0.2.2` alias instead. iOS simulators can use `localhost` directly.
const LOCAL_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

// REST base — every endpoint lives under /api (see HealingSathiBackend/ARCHITECTURE.md).
export const API_URL = `http://${LOCAL_HOST}:4000/api`;
