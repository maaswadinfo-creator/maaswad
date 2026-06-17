# Maaswad REST API Reference

Base URL: `/api/v1` · Interactive docs (Swagger UI): `GET /api/docs` · OpenAPI JSON: `GET /api/docs.json`
Auth: `Authorization: Bearer <accessToken>` (except public catalog + auth endpoints).

## Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/request` | Request OTP (`{ channel:'phone'|'email', phone?, email? }`) |
| POST | `/auth/otp/verify` | Verify OTP → returns user + access/refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token for a new access token |
| POST | `/auth/logout` | Revoke a refresh token |
| GET  | `/auth/me` | Current user + active role |
| POST | `/auth/switch-role` | Switch active role (`{ role }`) |

## Catalog (public)
| GET | `/catalog/dishes` | Browse published dishes (search, foodType, cuisine, category, price, rating, paging) |
| GET | `/catalog/dishes/:id` | Dish detail + reviews |
| GET | `/catalog/chefs` | Browse chefs |
| GET | `/catalog/chefs/:id` | Public chef profile + dishes |
| GET | `/catalog/categories` | Cuisine & special categories |

## Orders (customer)
| POST | `/orders/quote` | Price a cart (margin, fees, coupon, loyalty) |
| POST | `/orders/checkout` | Create order + payment intent |
| POST | `/orders/:id/pay` | Confirm dummy payment → notifies chef |
| GET  | `/orders/mine` | Customer order history |
| GET  | `/orders/:id` | Order detail / tracking |
| POST | `/orders/:id/confirm` | Customer confirms delivery |
| POST | `/orders/:id/reorder` | Build a reorder payload |

## Chef
| POST | `/chefs/apply` | Submit chef application |
| GET/PATCH | `/chefs/me` | Chef profile |
| GET | `/chefs/dashboard` | Sales, revenue, pending/active orders, rating, payouts |
| GET/POST | `/chefs/dishes` | List / create dishes |
| PATCH/DELETE | `/chefs/dishes/:id` | Edit / delete dish |
| PATCH | `/chefs/dishes/:id/toggle` | Pause / resume |
| GET | `/chefs/orders` | Chef order queue |
| PATCH | `/chefs/orders/:id/status` | accept / reject / preparing / ready |
| GET | `/chefs/settlements` | Settlement reports |
| POST | `/chefs/reviews/:id/reply` | Reply to a review |

## Delivery partner
| POST | `/delivery/apply` | Apply as rider |
| PATCH | `/delivery/availability` | Online/offline + location |
| GET | `/delivery/assigned` | Active assigned orders |
| PATCH | `/delivery/orders/:id/status` | pickup_started / picked_up / out_for_delivery / delivered |
| GET | `/delivery/earnings` · `/delivery/history` | Earnings & history |

## Customer (me)
Addresses, notifications, FCM token, coupon validate, loyalty profile, subscriptions (create/pause/resume), catering requests — all under `/me/*`.

## Reviews
| POST | `/reviews` | Submit rating/review/images |
| GET | `/reviews/dish/:dishId` | Dish reviews |

## Admin / Owner (`/admin/*`, RBAC: owner + ops; some owner-only)
Chef review, dish review/feature, customer suspend, delivery-partner review, order list + rider assignment, coupon CRUD, review moderation, revenue dashboard, settlements (run/generate/list), platform settings get/patch, audit logs (owner), user analytics (owner).
