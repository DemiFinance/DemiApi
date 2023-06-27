export class Method {
  constructor(config: any) {}
  elements = {
    createToken: async (params: any) => {
      return {
        element_token: 'mock-element-token',
      };
    },
  };
}


