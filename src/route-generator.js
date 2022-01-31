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

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    });

    logService.log(`Generated GET "/${model.pluralName}/:id" route`);
    this.app.get(`/${model.pluralName}/:id`, async (req, res) => {
      const data = await model.get(req.params.id);

      if (!data) {
        return res.sendStatus(404);
      }

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    });
  }

  generatePutRoutes(model) {
    logService.log(`Generated PUT "/${model.pluralName}/:id" route`);
    this.app.put(`/${model.pluralName}/:id`, async (req, res) => {
      const target = await model.get(req.params.id);

      if (!target) {
        return res.sendStatus(404);
      }

      const result = await model.update(req.params.id, req.body);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    });
  }

  generatePostRoutes(model) {
    logService.log(`Generated POST "/${model.pluralName}/:id" route`);
    this.app.post(`/${model.pluralName}`, async (req, res) => {
      const result = await model.create(req.body);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    });
  }

  generateDeleteRoutes(model) {}
}
