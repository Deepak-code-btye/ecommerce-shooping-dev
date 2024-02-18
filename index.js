import dotenv from "dotenv";
import express from "express";
const app = express();
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import cookieParser from "cookie-parser";
import { createProduct } from "./controller/Product.js";
import productsRouter from "./routes/Products.js";
import categoriesRouter from "./routes/Categories.js";
import brandsRouter from "./routes/Brands.js";
import usersRouter from "./routes/Users.js";
import authRouter from "./routes/Auth.js";
import cartRouter from "./routes/Cart.js";
import ordersRouter from "./routes/Order.js";
import User from "./model/User.js";
import { isAuth, sanitizeUser, cookieExtractor } from "./services/common.js";
import stripe from "stripe";

dotenv.config();

// database
connectDB();

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import morgan from "morgan";
import connectDB from "./db/conn.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Webhook

const endpointSecret = process.env.ENDPOINT_SECRET;

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;

        const order = await Order.findById(
          paymentIntentSucceeded.metadata.orderId
        );
        order.paymentStatus = "received";
        await order.save();

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

// JWT options

const opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY;

//middlewares

app.use(express.json());
app.use(morgan("dev"));

// app.use(express.static(join(__dirname, "build")));

// app.use(express.static(path.resolve(__dirname, "build")));
app.use(cookieParser());
// app.use(
//   session({
//     secret: process.env.SESSION_KEY,
//     resave: false, // don't save session if unmodified
//     saveUninitialized: false, // don't create session until something stored
//   })
// );
// app.use(passport.authenticate("session"));

// cors origin
app.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);
app.use(express.json()); // to parse req.body

app.use("/products", productsRouter);
// we can also use JWT token for client-only auth
app.use("/categories", isAuth(), categoriesRouter);
app.use("/brands", isAuth(), brandsRouter);
app.use("/users", isAuth(), usersRouter);
app.use("/auth", authRouter);
app.use("/cart", isAuth(), cartRouter);
app.use("/orders", isAuth(), ordersRouter);

// this line we add to make react router work in case of other routes doesnt match
app.get("*", (req, res) => res.sendFile(path.resolve("build", "index.html")));
app.get("/", (req, res) => res.sendFile("welcome to ecommerce app"));

// Passport Strategies
// passport.use(
//   "local",
//   new LocalStrategy({ usernameField: "email" }, async function (
//     email,
//     password,
//     done
//   ) {
//     // by default passport uses username
//     console.log({ email, password });
//     try {
//       const user = await User.findOne({ email: email });
//       console.log(email, password, user);
//       if (!user) {
//         return done(null, false, { message: "invalid credentials" }); // for safety
//       }
//       crypto.pbkdf2(
//         password,
//         user.salt,
//         310000,
//         32,
//         "sha256",
//         async function (err, hashedPassword) {
//           if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
//             return done(null, false, { message: "invalid credentials" });
//           }
//           const token = jwt.sign(
//             sanitizeUser(user),
//             process.env.JWT_SECRET_KEY
//           );
//           done(null, { id: user.id, role: user.role, token }); // this lines sends to serializer
//         }
//       );
//     } catch (err) {
//       done(err);
//     }
//   })
// );

// passport.use(
//   "jwt",
//   new JwtStrategy(opts, async function (jwt_payload, done) {
//     try {
//       const user = await User.findById(jwt_payload.id);
//       if (user) {
//         return done(null, sanitizeUser(user)); // this calls serializer
//       } else {
//         return done(null, false);
//       }
//     } catch (err) {
//       return done(err, false);
//     }
//   })
// );

// this creates session variable req.user on being called from callbacks
// passport.serializeUser(function (user, cb) {
//   process.nextTick(function () {
//     return cb(null, { id: user.id, role: user.role });
//   });
// });

// this changes session variable req.user when called from authorized request

// passport.deserializeUser(function (user, cb) {
//   process.nextTick(function () {
//     return cb(null, user);
//   });
// });

// Payments

const stripeInstance = stripe(process.env.STRIPE_app_KEY);

app.post("/create-payment-intent", async (req, res) => {
  const { totalAmount, orderId } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripeInstance.paymentIntents.create({
    amount: totalAmount * 100, // Convert amount to cents
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      orderId,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.listen(process.env.PORT, () => {
  console.log("app started", process.env.PORT);
});
