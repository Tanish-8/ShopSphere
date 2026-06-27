export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "ShopSphere API Documentation",
    version: "1.0.0",
    description: "Production-ready API specifications for the ShopSphere e-commerce application.",
  },
  servers: [
    {
      url: "/api",
      description: "Base API URL",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <token>",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["customer", "admin"] },
          isVerified: { type: "boolean" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          stock: { type: "integer" },
          category: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          rating: { type: "number" },
          numReviews: { type: "integer" },
          reviews: { type: "array", items: { $ref: "#/components/schemas/Review" } },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          name: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Address: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          street: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zipCode: { type: "string" },
          country: { type: "string" },
          isDefault: { type: "boolean" },
        },
      },
      Coupon: {
        type: "object",
        properties: {
          _id: { type: "string" },
          code: { type: "string" },
          description: { type: "string" },
          discountType: { type: "string", enum: ["percentage", "fixed"] },
          discountValue: { type: "number" },
          minimumOrderAmount: { type: "number" },
          maximumDiscount: { type: "number" },
          usageLimit: { type: "integer" },
          usedCount: { type: "integer" },
          perUserLimit: { type: "integer" },
          startDate: { type: "string", format: "date-time" },
          expiryDate: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          orderItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                name: { type: "string" },
                image: { type: "string" },
                price: { type: "number" },
                quantity: { type: "integer" },
              },
            },
          },
          shippingAddress: {
            type: "object",
            properties: {
              fullName: { type: "string" },
              phone: { type: "string" },
              street: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              zipCode: { type: "string" },
              country: { type: "string" },
            },
          },
          paymentMethod: { type: "string" },
          itemsPrice: { type: "number" },
          discountApplied: { type: "number" },
          shippingPrice: { type: "number" },
          taxPrice: { type: "number" },
          totalPrice: { type: "number" },
          status: { type: "string" },
          isPaid: { type: "boolean" },
          paidAt: { type: "string", format: "date-time" },
          paymentStatus: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Detailed error details description" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "secure123" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid input parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user & return token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "secure123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string" },
                        isVerified: { type: "boolean" },
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/auth/profile": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user profile details",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "User details profile payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Not authorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      put: {
        tags: ["Authentication"],
        summary: "Update current user profile details",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request a forgot password token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Success response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/reset-password/{token}": {
      post: {
        tags: ["Authentication"],
        summary: "Reset credentials using verification token",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string", minLength: 6 } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Credentials changed successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
          },
        },
      },
    },
    "/auth/verify-email/{token}": {
      post: {
        tags: ["Authentication"],
        summary: "Verify user email address using verification token",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Email verified successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
          },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        tags: ["Authentication"],
        summary: "Resend email verification token link",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Resent successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
          },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "Get filtered, sorted, and paginated products",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "rating", in: "query", schema: { type: "number" } },
          { name: "inStock", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "sort", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 8 } },
        ],
        responses: {
          200: {
            description: "Products list returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    totalProducts: { type: "integer" },
                    totalPages: { type: "integer" },
                    currentPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a new product (Admin)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price", "description", "category", "stock"],
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  description: { type: "string" },
                  category: { type: "string" },
                  stock: { type: "integer" },
                  image: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Product created successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Product" } } } } },
          },
        },
      },
    },
    "/products/top": {
      get: {
        tags: ["Products"],
        summary: "Get top rated products",
        responses: {
          200: {
            description: "Top rated products list returned",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Product" } } } } } },
          },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product details by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Product details returned",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Product" } } } } },
          },
        },
      },
      put: {
        tags: ["Products"],
        summary: "Update product details (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  description: { type: "string" },
                  category: { type: "string" },
                  stock: { type: "integer" },
                  images: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Product updated successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Product" } } } } },
          },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete product by ID (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Product deleted successfully",
          },
        },
      },
    },
    "/products/{id}/reviews": {
      get: {
        tags: ["Products"],
        summary: "Get reviews for a product",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "List of reviews",
          },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Add a review to a product",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating", "comment"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  comment: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Review added successfully",
          },
        },
      },
    },
    "/wishlist": {
      get: {
        tags: ["Wishlist"],
        summary: "Get user wishlist",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Wishlist payload returned",
          },
        },
      },
    },
    "/wishlist/{productId}": {
      post: {
        tags: ["Wishlist"],
        summary: "Add product to wishlist",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Added successfully",
          },
        },
      },
      delete: {
        tags: ["Wishlist"],
        summary: "Remove product from wishlist",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "productId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Removed successfully",
          },
        },
      },
    },
    "/addresses": {
      get: {
        tags: ["Addresses"],
        summary: "Get all customer addresses",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Addresses array returned",
          },
        },
      },
      post: {
        tags: ["Addresses"],
        summary: "Create a new address record",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["street", "city", "state", "zipCode", "country"],
                properties: {
                  street: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zipCode: { type: "string" },
                  country: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created successfully",
          },
        },
      },
    },
    "/addresses/{id}": {
      put: {
        tags: ["Addresses"],
        summary: "Update address properties",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  street: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zipCode: { type: "string" },
                  country: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated successfully",
          },
        },
      },
      delete: {
        tags: ["Addresses"],
        summary: "Delete an address record",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Deleted successfully",
          },
        },
      },
    },
    "/addresses/{id}/default": {
      put: {
        tags: ["Addresses"],
        summary: "Set default address selection",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Selected as default successfully",
          },
        },
      },
    },
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "Get all orders list (Admin)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "List of all orders returned",
          },
        },
      },
      post: {
        tags: ["Orders"],
        summary: "Place a new customer order",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderItems", "shippingAddress", "paymentMethod"],
                properties: {
                  orderItems: { type: "array", items: { type: "object" } },
                  shippingAddress: { type: "object" },
                  paymentMethod: { type: "string" },
                  couponCode: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Order placed successfully",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Order" } } } } },
          },
        },
      },
    },
    "/orders/calculate": {
      post: {
        tags: ["Orders"],
        summary: "Preview order pricing summary before checkout",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderItems"],
                properties: {
                  orderItems: { type: "array", items: { type: "object" } },
                  couponCode: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Calculated summary returned",
          },
        },
      },
    },
    "/orders/myorders": {
      get: {
        tags: ["Orders"],
        summary: "Get current user orders history list",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Orders array returned",
          },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order details by ID",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Order payload details",
          },
        },
      },
    },
    "/orders/{id}/invoice": {
      get: {
        tags: ["Orders"],
        summary: "Download invoice PDF for an order",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Binary PDF stream attachment",
            content: { "application/pdf": {} },
          },
        },
      },
    },
    "/orders/{id}/pay": {
      put: {
        tags: ["Orders"],
        summary: "Update order payment status to paid",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Status set to paid successfully",
          },
        },
      },
    },
    "/orders/{id}/status": {
      put: {
        tags: ["Orders"],
        summary: "Update order fulfillment status (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Fulfillment updated successfully",
          },
        },
      },
    },
    "/payments/razorpay-order": {
      post: {
        tags: ["Payments"],
        summary: "Create a Razorpay payment order",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "orderId"],
                properties: {
                  amount: { type: "number" },
                  orderId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Razorpay order payload details returned",
          },
        },
      },
    },
    "/payments/razorpay-verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify Razorpay checkout signature and payment",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "orderId"],
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                  orderId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Payment verification passed",
          },
        },
      },
    },
    "/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Handle Razorpay payment webhook event",
        requestBody: {
          required: true,
          content: { "application/json": {} },
        },
        responses: {
          200: {
            description: "Webhook processed successfully",
          },
        },
      },
    },
    "/coupons/validate": {
      post: {
        tags: ["Coupons"],
        summary: "Validate coupon code for items",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "cartItems"],
                properties: {
                  code: { type: "string" },
                  cartItems: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Validation passed",
          },
        },
      },
    },
    "/coupons": {
      get: {
        tags: ["Coupons"],
        summary: "Get coupons list (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: {
            description: "Coupons list returned",
          },
        },
      },
      post: {
        tags: ["Coupons"],
        summary: "Create a new coupon (Admin)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["code", "description", "discountType", "discountValue", "expiryDate"],
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  discountType: { type: "string", enum: ["percentage", "fixed"] },
                  discountValue: { type: "number" },
                  minimumOrderAmount: { type: "number" },
                  maximumDiscount: { type: "number" },
                  usageLimit: { type: "integer" },
                  perUserLimit: { type: "integer" },
                  startDate: { type: "string", format: "date" },
                  expiryDate: { type: "string", format: "date" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created successfully",
          },
        },
      },
    },
    "/coupons/{id}": {
      put: {
        tags: ["Coupons"],
        summary: "Update coupon parameters (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  discountType: { type: "string" },
                  discountValue: { type: "number" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated successfully",
          },
        },
      },
      delete: {
        tags: ["Coupons"],
        summary: "Delete coupon by ID (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Deleted successfully",
          },
        },
      },
    },
    "/upload": {
      post: {
        tags: ["Uploads"],
        summary: "Upload single image to Cloudinary (Admin)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Upload success, returns URLs",
          },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all user accounts (Admin)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Users list returned",
          },
        },
      },
    },
    "/admin/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete user account (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Deleted successfully",
          },
        },
      },
    },
    "/admin/users/{id}/role": {
      put: {
        tags: ["Admin"],
        summary: "Modify user account privilege role (Admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["customer", "admin"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated successfully",
          },
        },
      },
    },
    "/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get overall platform analytics & stats (Admin)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Analytics payload returned",
          },
        },
      },
    },
  },
};
