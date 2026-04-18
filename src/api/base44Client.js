export const base44 = {
  auth: {
    me: async () => null,
    login: async () => null,
    register: async () => null,
    logout: async () => {},
    updateMe: async () => {},
  },

  entities: new Proxy({}, {
    get: () => ({
      list: async () => [],
      filter: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    }),
  }),

  functions: {
    invoke: async () => ({ data: null }),
  },

  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: "" }),
      InvokeLLM: async () => ({}),
    },
  },
};