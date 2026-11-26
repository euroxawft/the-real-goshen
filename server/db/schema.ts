import { relations, sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { CONTACT_STATUSES, CONTACT_SUBJECTS, INTEREST_STATUSES } from '@/server/common/constants';

export const availabilityEnum = pgEnum('product_availability', ['ready_stock', 'preorder']);
export const stockStatusEnum = pgEnum('stock_status', ['in_stock', 'limited', 'out_of_stock']);
export const discountScopeEnum = pgEnum('discount_scope', ['all', 'product']);
export const interestStatusEnum = pgEnum('interest_status', INTEREST_STATUSES);
export const contactSubjectEnum = pgEnum('contact_subject', CONTACT_SUBJECTS);
export const contactStatusEnum = pgEnum('contact_status', CONTACT_STATUSES);

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const admins = pgTable('admins', {
  id: id(), name: varchar('name', { length: 120 }).notNull(), email: varchar('email', { length: 255 }).notNull().unique(), passwordHash: text('password_hash').notNull(), createdAt: createdAt(), updatedAt: updatedAt(),
});

export const adminRefreshTokens = pgTable('admin_refresh_tokens', {
  id: id(), adminId: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }), tokenHash: varchar('token_hash', { length: 64 }).notNull(), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), revokedAt: timestamp('revoked_at', { withTimezone: true }), replacedById: uuid('replaced_by_id'), userAgent: text('user_agent'), ip: varchar('ip', { length: 64 }), createdAt: createdAt(),
}, (table) => [index('refresh_admin_idx').on(table.adminId), index('refresh_expires_idx').on(table.expiresAt)]);

export const categories = pgTable('categories', {
  id: id(), name: varchar('name', { length: 100 }).notNull(), slug: varchar('slug', { length: 120 }).notNull().unique(), imageKey: text('image_key'), sortOrder: integer('sort_order').notNull().default(0), createdAt: createdAt(), updatedAt: updatedAt(),
});

export const products = pgTable('products', {
  id: id(), name: varchar('name', { length: 200 }).notNull(), slug: varchar('slug', { length: 220 }).notNull().unique(), description: text('description').notNull().default(''), price: integer('price').notNull(), categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }), images: text('images').array().notNull().default(sql`'{}'::text[]`), availability: availabilityEnum('availability').notNull().default('preorder'), leadTimeWeeksMin: integer('lead_time_weeks_min'), leadTimeWeeksMax: integer('lead_time_weeks_max'), stockStatus: stockStatusEnum('stock_status').notNull().default('in_stock'), isPublished: boolean('is_published').notNull().default(false), isFeatured: boolean('is_featured').notNull().default(false), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex('products_slug_uq').on(table.slug), check('products_lead_time_valid', sql`(${table.leadTimeWeeksMin} is null or ${table.leadTimeWeeksMin} >= 0) and (${table.leadTimeWeeksMax} is null or ${table.leadTimeWeeksMax} >= coalesce(${table.leadTimeWeeksMin}, 0))`), check('products_images_max', sql`coalesce(array_length(${table.images}, 1), 0) <= 8`), index('products_published_created_idx').on(table.isPublished, table.createdAt), index('products_category_idx').on(table.categoryId), check('products_price_nonneg', sql`${table.price} >= 0`)]);

export const discountEvents = pgTable('discount_events', {
  id: id(), name: varchar('name', { length: 120 }).notNull(), scope: discountScopeEnum('scope').notNull(), productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }), percentage: integer('percentage').notNull(), startsAt: timestamp('starts_at', { withTimezone: true }).notNull(), endsAt: timestamp('ends_at', { withTimezone: true }).notNull(), isActive: boolean('is_active').notNull().default(true), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index('discount_window_idx').on(table.startsAt, table.endsAt), index('discount_product_idx').on(table.productId), check('discount_percentage_range', sql`${table.percentage} between 1 and 90`), check('discount_window_valid', sql`${table.endsAt} > ${table.startsAt}`), check('discount_scope_product', sql`(${table.scope} = 'all' and ${table.productId} is null) or (${table.scope} = 'product' and ${table.productId} is not null)`)]);

export const discountProducts = pgTable('discount_products', {
  id: id(), discountEventId: uuid('discount_event_id').notNull().references(() => discountEvents.id, { onDelete: 'cascade' }), productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }), createdAt: createdAt(),
}, (table) => [uniqueIndex('discount_products_unique').on(table.discountEventId, table.productId), index('discount_products_event_idx').on(table.discountEventId), index('discount_products_product_idx').on(table.productId)]);

export const interests = pgTable('interests', {
  id: id(), reference: varchar('reference', { length: 20 }).notNull().unique(), customerName: varchar('customer_name', { length: 150 }).notNull(), customerEmail: varchar('customer_email', { length: 255 }).notNull(), customerPhone: varchar('customer_phone', { length: 40 }).notNull(), note: text('note'), status: interestStatusEnum('status').notNull().default('new'), totalEstimate: integer('total_estimate').notNull(), emailSentToCustomer: boolean('email_sent_to_customer').notNull().default(false), emailSentToStore: boolean('email_sent_to_store').notNull().default(false), lastRemindedAt: timestamp('last_reminded_at', { withTimezone: true }), reminderCount: integer('reminder_count').notNull().default(0), completedAt: timestamp('completed_at', { withTimezone: true }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index('interests_status_created_idx').on(table.status, table.createdAt), index('interests_email_idx').on(table.customerEmail), index('interests_created_idx').on(table.createdAt)]);

export const interestItems = pgTable('interest_items', {
  id: id(), interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }), productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }), productName: varchar('product_name', { length: 200 }).notNull(), productImageKey: text('product_image_key'), unitPrice: integer('unit_price').notNull(), originalPrice: integer('original_price').notNull(), discountPercent: integer('discount_percent').notNull().default(0), quantity: integer('quantity').notNull().default(1), availability: availabilityEnum('availability').notNull().default('preorder'), leadTimeWeeksMin: integer('lead_time_weeks_min'), leadTimeWeeksMax: integer('lead_time_weeks_max'), createdAt: createdAt(),
}, (table) => [index('interest_items_interest_idx').on(table.interestId), index('interest_items_product_idx').on(table.productId), check('interest_items_qty_range', sql`${table.quantity} between 1 and 10`)]);

export const interestReminders = pgTable('interest_reminders', {
  id: id(), interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }), message: text('message'), success: boolean('success').notNull().default(false), sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('interest_reminders_interest_idx').on(table.interestId, table.sentAt)]);

export const contacts = pgTable('contacts', {
  id: id(), name: varchar('name', { length: 150 }).notNull(), email: varchar('email', { length: 255 }).notNull(), phone: varchar('phone', { length: 40 }), subject: contactSubjectEnum('subject').notNull(), message: text('message').notNull(), status: contactStatusEnum('status').notNull().default('new'), autoReplySent: boolean('auto_reply_sent').notNull().default(false), storeNotified: boolean('store_notified').notNull().default(false), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index('contacts_status_created_idx').on(table.status, table.createdAt), index('contacts_subject_idx').on(table.subject)]);

export const contactReplies = pgTable('contact_replies', {
  id: id(), contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }), adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }), message: text('message').notNull(), emailSent: boolean('email_sent').notNull().default(false), createdAt: createdAt(),
}, (table) => [index('contact_replies_contact_idx').on(table.contactId, table.createdAt)]);

export const blogPosts = pgTable('blog_posts', {
  id: id(), title: varchar('title', { length: 220 }).notNull(), slug: varchar('slug', { length: 240 }).notNull().unique(), excerpt: text('excerpt').notNull().default(''), content: text('content').notNull().default(''), coverImageKey: text('cover_image_key'), isPublished: boolean('is_published').notNull().default(false), publishedAt: timestamp('published_at', { withTimezone: true }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [index('blog_published_idx').on(table.isPublished, table.publishedAt)]);

export const faqs = pgTable('faqs', {
  id: id(), question: text('question').notNull(), answer: text('answer').notNull(), sortOrder: integer('sort_order').notNull().default(0), isPublished: boolean('is_published').notNull().default(true), createdAt: createdAt(), updatedAt: updatedAt(),
});

export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1), whatsappNumber: varchar('whatsapp_number', { length: 30 }).notNull().default(''), defaultLeadTimeWeeksMin: integer('default_lead_time_weeks_min').notNull().default(4), defaultLeadTimeWeeksMax: integer('default_lead_time_weeks_max').notNull().default(8), preorderNote: text('preorder_note'), storeEmail: varchar('store_email', { length: 255 }).notNull().default(''), instagramUrl: text('instagram_url'), tiktokUrl: text('tiktok_url'), facebookUrl: text('facebook_url'), address: text('address'), businessHours: text('business_hours'), heroHeadline: text('hero_headline').notNull().default(''), heroSubheadline: text('hero_subheadline').notNull().default(''), heroImageKey: text('hero_image_key'), aboutBody: text('about_body').notNull().default(''), aboutImageKey: text('about_image_key'), announcementText: text('announcement_text'), announcementActive: boolean('announcement_active').notNull().default(false), updatedAt: updatedAt(),
}, (table) => [check('site_settings_single_row', sql`${table.id} = 1`)]);

export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 120 }).primaryKey(), count: integer('count').notNull().default(0), windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});

export const adminsRelations = relations(admins, ({ many }) => ({ refreshTokens: many(adminRefreshTokens), replies: many(contactReplies) }));
export const adminRefreshTokensRelations = relations(adminRefreshTokens, ({ one }) => ({ admin: one(admins, { fields: [adminRefreshTokens.adminId], references: [admins.id] }) }));
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one, many }) => ({ category: one(categories, { fields: [products.categoryId], references: [categories.id] }), discountEvents: many(discountEvents), interestItems: many(interestItems) }));
export const discountEventsRelations = relations(discountEvents, ({ one, many }) => ({ product: one(products, { fields: [discountEvents.productId], references: [products.id] }), discountProducts: many(discountProducts) }));
export const discountProductsRelations = relations(discountProducts, ({ one }) => ({ discountEvent: one(discountEvents, { fields: [discountProducts.discountEventId], references: [discountEvents.id] }), product: one(products, { fields: [discountProducts.productId], references: [products.id] }) }));
export const interestsRelations = relations(interests, ({ many }) => ({ items: many(interestItems), reminders: many(interestReminders) }));
export const interestItemsRelations = relations(interestItems, ({ one }) => ({ interest: one(interests, { fields: [interestItems.interestId], references: [interests.id] }), product: one(products, { fields: [interestItems.productId], references: [products.id] }) }));
export const interestRemindersRelations = relations(interestReminders, ({ one }) => ({ interest: one(interests, { fields: [interestReminders.interestId], references: [interests.id] }) }));
export const contactsRelations = relations(contacts, ({ many }) => ({ replies: many(contactReplies) }));
export const contactRepliesRelations = relations(contactReplies, ({ one }) => ({ contact: one(contacts, { fields: [contactReplies.contactId], references: [contacts.id] }), admin: one(admins, { fields: [contactReplies.adminId], references: [admins.id] }) }));

export type Admin = typeof admins.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type DiscountEvent = typeof discountEvents.$inferSelect;
export type DiscountProduct = typeof discountProducts.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type InterestItem = typeof interestItems.$inferSelect;
export type InterestReminder = typeof interestReminders.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type ContactReply = typeof contactReplies.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
