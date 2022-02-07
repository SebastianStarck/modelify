import { readFileSync } from "fs";
import logService from "./log-service.js";
import path from "path";
import _ from "lodash";

export default async function generateDoc(models) {
  const docFilePath = // FIXME: Clean up path reading?
    path.resolve() + "/node_modules/modelify/docs/template.json";
  const docFile = JSON.parse(readFileSync(docFilePath, "utf8") || "{}");

  if (!docFile.info) {
    logService.warning("Documentation template file failed to load");
  }

  models.forEach((model) => {
    docFile.components.schemas[model.capitalizedName] = {
      type: "object",
      properties: parseFieldsForDocumentation(model.fields),
    };

    for (const relation of model.relations.values()) {
      docFile.components.schemas[relation.capitalizedName] = {
        type: "object",
        properties: parseFieldsForDocumentation(relation.fields),
      };
    }

    for (const attribute of model.attributes.values()) {
      docFile.components.schemas[attribute.capitalizedName] = {
        type: "object",
        properties: parseFieldsForDocumentation(attribute.fields),
      };
    }

    docFile.paths[`/${model.name}`] = {
      put: generateOperationDocumentation("put", model),
      post: generateOperationDocumentation("post", model),
      get: generateOperationDocumentation("get", model),
      delete: generateOperationDocumentation("delete", model),
    };
  });

  return docFile;
}

function generateOperationDocumentation(operation, model) {
  const summary = {
    put: `Update an existing ${model.name}`,
    post: `Create a new ${model.name}`,
    get: `Get an existing ${model.name}`,
    delete: `Delete an existing ${model.name}`,
  }[operation];

  const descriptionAction = {
    put: "updated",
    post: "created",
    get: "retrieved",
    delete: "deleted",
  }[operation];

  return {
    tags: [model.capitalizedName],
    summary,
    requestBody: {
      description: `${model.capitalizedName} object that needs to be ${descriptionAction}`,
      content: {
        "application/json": {
          schema: {
            $ref: `#/components/schemas/${model.capitalizedName}`,
          },
        },
      },
      required: ["put", "post"].includes(operation),
    },
    responses: getResponsesForOperation(operation, model),
  };
}

function getResponsesForOperation(operation, model) {
  const operations = {};

  if (["put", "get", "delete"].includes(operation)) {
    operations[400] = {
      description: "Invalid ID supplied",
      content: {},
    };
    operations[404] = {
      description: `${model.capitalizedName} not found`,
      content: {},
    };
  }

  if (operation === "post") {
    operations[405] = {
      description: "Invalid input",
      content: {},
    };
  }
}

function parseFieldsForDocumentation(fields) {
  return fields.reduce((result, { Field, Type }) => {
    const [firstWord, ...rest] = Field.split("_");
    const isForeignKey = firstWord === "id" && rest.length;
    const isNumber = Type.includes("int");

    const fieldMeta = {
      type: isNumber ? "integer" : "string",
      format: isNumber ? "int32" : null,
    };

    if (isForeignKey) {
      _.set(fieldMeta, "$ref", `#/components/schemas/${_.startCase(rest)}`);
    }

    return _.set(result, Field, fieldMeta);
  }, {});
}

function parseAttributeEntriesForDocumentation(entries) {
  return entries.reduce((result, { Field, Type }) => {
    const [firstWord, ...rest] = Field.split("_");
    const isForeignKey = firstWord === "id" && rest.length;
    const isNumber = Type.includes("int");

    const fieldMeta = {
      type: isNumber ? "integer" : "string",
      format: isNumber ? "int32" : null,
    };

    if (isForeignKey) {
      _.set(fieldMeta, "$ref", `#/components/schemas/${_.startCase(rest)}`);
    }

    return _.set(result, Field, fieldMeta);
  }, {});
}
