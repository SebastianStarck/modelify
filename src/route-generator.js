import logService from "./log-service.js";

export default class RouteGenerator {
  app;

  constructor(app) {
    this.app = app;
  }

  generate(model) {
    this.generateGetRoutes(model);
    this.generatePutRoutes(model);
    this.generatePostRoutes(model);
    this.generateDeleteRoutes(model);
  }

  generateGetRoutes(model) {
    logService.log(`Generated GET "/${model.pluralName}" route`);
    this.app.get(`/${model.pluralName}`, async (req, res) => {
      const data = await model.getAll();

      console.log(data);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data, null, 3));
    });
  }

  generatePutRoutes(model) {}

  generatePostRoutes(model) {}

  generateDeleteRoutes(model) {}
}
