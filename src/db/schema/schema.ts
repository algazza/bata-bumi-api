  import { datetime } from "drizzle-orm/mysql-core";
import { pgTable, serial, varchar, timestamp, integer, date, boolean } from "drizzle-orm/pg-core";

  export const address = pgTable("address", {
    id: serial("id").primaryKey(),
    address: varchar("address", { length: 100 }).notNull(),
    zip_code: integer("zip_code").notNull().notNull(),
    city: varchar("city", { length: 150 }).notNull(),
  });

  export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 150 }).notNull().unique(),
    phone: varchar("phone", { length: 150 }).notNull(),
    password: varchar("password", { length: 150 }).notNull(),
    address_id: integer("address_id").references(() => address.id,{ onDelete: "cascade", onUpdate: "cascade" }),
  });

  export const disable_date = pgTable("disable_date", {
    id: serial("id").primaryKey(),
    disable_date: date("disable_date").notNull(),
  });

  export const service = pgTable("service", {
    id: serial("id").primaryKey(),
    service: varchar("service").notNull(),
    price: integer("price").notNull(),
    description: varchar("description").notNull(),
  });

  export const handyman = pgTable("handyman", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    image_path: varchar("image_path", { length: 150 }).notNull().unique(),
    description: varchar("description", { length: 150 }).notNull(),
    priority: integer("priority").notNull().references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
    disable_id: integer("disable_id").references(() => disable_date.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });


  export const payment = pgTable("payment", {
    id: serial("id").primaryKey(),
    status: varchar("status").notNull(),
  });

  export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    total_price : integer("total_price").notNull(),
    status: varchar("status").notNull(),
    order_unique_id: varchar("order_unique_id", { length: 150 }).unique().notNull(),
    payment_id: integer("payment_id").references(() => payment.id, { onDelete: "cascade", onUpdate: "cascade" }),
    created_at: timestamp("created_at").notNull(),
  });

  export const service_handyman = pgTable("service_handyman", {
    id: serial("id").primaryKey(),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
    service_id: integer("service_id").references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });

  export const service_order = pgTable("service_order", {
    id: serial("id").primaryKey(),
    total_price : integer("total_price").notNull(),
    session: integer("session").notNull(),
    issue_image_path: varchar("issue_image_path").notNull(),
    start_date: timestamp("start_date").notNull(),
    issue_description: varchar("issue_description").notNull(),
    order_id: integer("order_id").references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    user_id: integer("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });

    export const service_order_handyman = pgTable("service_order_handyman", {
    id: serial("id").primaryKey(),
    service_order_id: integer("service_order_id").references(() => service_order.id, { onDelete: "cascade", onUpdate: "cascade" }),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });

  export const handyman_histories = pgTable("handyman_histories", {
    id: serial("id").primaryKey(),
    description: varchar("description").notNull(),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });

  export const job_proggres = pgTable("job_proggres", {
    id: serial("id").primaryKey(),
    image_path: varchar("image_path").notNull(),
    description : varchar("description").notNull(),
    finish: boolean("finish").default(false), 
    created_at: timestamp("created_at").notNull(),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
    service_order_id: integer("service_order_id").references(() => service_order.id, { onDelete: "cascade", onUpdate: "cascade" })
  });

  export const notification = pgTable("notification", {
    id: serial("id").primaryKey(),
    order_id: integer("order_id").references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    payment_id: integer("payment_id").references(() => payment.id, { onDelete: "cascade", onUpdate: "cascade" }),
    job_proggress_id: integer("job_proggress_id").references(() => job_proggres.id, { onDelete: "cascade", onUpdate: "cascade" }),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
    user_id: integer("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });

  export const review = pgTable("review", {
    id: serial("id").primaryKey(),
    description : varchar("description").notNull(),
    rate : integer("rate").notNull(),
    handyman_id: integer("handyman_id").references(() => handyman.id, { onDelete: "cascade", onUpdate: "cascade" }),
    user_id: integer("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    service_order_id: integer("service_order_id").references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
  });