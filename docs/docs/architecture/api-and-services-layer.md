---
sidebar_position: 4
---

# API & Services Layer

## The shared axios instance

`fe/src/config/api.ts` exports one configured axios instance used by every service in the app:

```ts
const api = axios.create({baseURL: API_URL});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) emitUnauthorized();
    return Promise.reject(error);
  },
);
```

Two interceptors, two jobs:

- **Request**: attach the Bearer token from `AsyncStorage` to every outgoing request, automatically.
- **Response**: on any `401`, call `emitUnauthorized()` instead of trying to handle the logout here directly.

### Why `authEvents.ts` exists

`api.ts` is a plain module — it has no access to React context, and importing `UserContext` here would be backwards (a config file depending on application state). `fe/src/utils/authEvents.ts` is a tiny pub/sub (`Set<Listener>`, `onUnauthorized`/`emitUnauthorized`) that exists purely to decouple these two things: axios (outside the React tree) can announce "the backend just rejected this token," and `UserContext` (inside the React tree) subscribes to that announcement and reacts by logging out. Neither side needs to know how the other is implemented.

## The service layer

Eight thin files in `fe/src/services/`, each a domain-specific wrapper around `api`:

| Service | Endpoints |
|---|---|
| `AuthService.ts` | `POST /auth/signin`, `POST /auth/signup`, `POST /auth/apple`, `POST /auth/signout`, `PATCH /auth/update-password`, `DELETE /auth/delete-account`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| `UserService.ts` | `GET /user`, `PUT /user` |
| `BlogService.ts` | `GET /blog-posts`, `GET /blog-posts/:id/comments`, `POST /blog-posts/:id/comments`, `GET /blog-posts/:id/likes`, `POST /blog-posts/:id/like`, `DELETE /blog-posts/:id/like` |
| `DesignService.ts` | `POST /designs` (multipart USDZ upload), `GET /designs`, `POST /designs/publish` (multipart), `GET /designs/explore`, `POST /designs/:id/view`, `DELETE /designs/:id` |
| `DesignTemplateService.ts` | `GET /design-templates` |
| `FurnitureService.ts` | `GET /furniture` |
| `MoodboardService.ts` | `GET /moodboard`, `POST /moodboard/:designId`, `DELETE /moodboard/:designId` |
| `NoteService.ts` | `GET /notes`, `POST /notes`, `PATCH /notes/:id`, `PATCH /notes/:id/soft-delete`, `PATCH /notes/:id/restore`, `DELETE /notes/:id` — plus local-only draft persistence via `AsyncStorage` (key `pendingArNoteDraft`), which is not an API call at all |
| `FeedbackService.ts` | `POST /feedback` |

None of these carry business logic beyond shaping requests/responses — no caching, no retries, no request deduplication. If a screen needs derived/computed data, that logic lives in the screen or component, not the service.

## Types

`fe/interface/*.ts` holds the domain types these services traffic in: `auth_user`, `blog`, `design`, `design-template`, `furniture`, `note`. (`UserService.ts` is the one exception — it declares its own `IUserProfile`/response types locally instead of in `interface/`, worth normalizing at some point.)
