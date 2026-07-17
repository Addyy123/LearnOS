export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "LearnOS Core API",
    version: "1.0.0",
    description: "Public synchronous contract for LearnOS domains.",
  },
  servers: [
    {
      url: "/api",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new learner account",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "role"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                  },
                  password: {
                    type: "string",
                    minLength: 12,
                  },
                  role: {
                    type: "string",
                    enum: ["LEARNER"],
                  },
                  parental_consent_email: {
                    type: "string",
                    format: "email",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created successfully (Pending Verification)",
          },
        },
      },
    },
    "/chat": {
      post: {
        summary: "Send a message to the grounded AI tutor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messages"],
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string" },
                        content: { type: "string" }
                      }
                    }
                  },
                  conversationId: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Streaming SSE response or final synchronous response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    role: { type: "string", example: "assistant" },
                    content: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
