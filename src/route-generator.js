import logService from "./log-service.js";
import _ from "lodash";

export default class RouteGenerator {
  app;

  constructor(app) {
    this.app = app;
  }

  generate(model) {
    logService.log(`\n${_.capitalize(model.name)} endpoints:`);
    this.generateGetRoutes(model);
    this.generatePutRoutes(model);
    this.generatePostRoutes(model);
    this.generateDeleteRoutes(model);
  }

  generateGetRoutes(model) {
    logService.logRouteGen("GET", `/${model.pluralName}`);
    this.app.get(`/${model.pluralName}`, async (req, res) => {
      const data = await model.get();

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    });

    logService.logRouteGen("GET", `/${model.pluralName}/:id`);
    this.app.get(`/${model.pluralName}/:id`, async (req, res) => {
      try {
        const data = await model.get(req.params.id);

        if (!data) {
          return res.status(404).send({ success: false, status: "Not found" });
        }

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  }

  generatePutRoutes(model) {
    logService.logRouteGen("PUT", `/${model.pluralName}/:id`);
    this.app.put(`/${model.pluralName}/:id`, async (req, res) => {
      try {
        const target = await model.get(req.params.id);

        if (!target) {
          return res.sendStatus(404);
        }

        const result = await model.update(req.params.id, req.body);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  }

  generatePostRoutes(model) {
    logService.logRouteGen("POST", `/${model.pluralName}`);
    this.app.post(`/${model.pluralName}`, async (req, res) => {
      try {
        const result = await model.create(req.body);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  }

  generateDeleteRoutes(model) {
    logService.logRouteGen("DELETE", `/${model.pluralName}/:id`);
    this.app.delete(`/${model.pluralName}/:id`, async (req, res) => {
      try {
        const target = await model.get(req.params.id);

        if (!target) {
          return res.sendStatus(404);
        }

        const result = await model.delete(req.params.id);

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  }
}
