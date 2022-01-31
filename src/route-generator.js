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
    logService.logRouteGen("GET", `/${model.pluralName}`);
    this.app.get(`/${model.pluralName}`, async (req, res) => {
      const data = await model.getAll();

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    });

    logService.logRouteGen("GET", `/${model.pluralName}/:id`);
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
    logService.logRouteGen("PUT", `/${model.pluralName}/:id`);
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
    logService.logRouteGen("POST", `/${model.pluralName}`);
    this.app.post(`/${model.pluralName}`, async (req, res) => {
      const result = await model.create(req.body);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    });
  }

  generateDeleteRoutes(model) {
    logService.logRouteGen("DELETE", `/${model.pluralName}/:id`);
    this.app.delete(`/${model.pluralName}/:id`, async (req, res) => {
      const target = await model.get(req.params.id);

      if (!target) {
        return res.sendStatus(404);
      }

      const result = await model.delete(req.params.id);

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    });
  }
}
