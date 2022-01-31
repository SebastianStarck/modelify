import consola from "consola";

function log(str) {
  consola.log(str);
}

function logRouteGen(method, route) {
  consola.success(
    ` ${method.padStart(7, " ")} ${route.padEnd(20, " ")} created`
  );
}

function logModelLoaded(model) {
  consola.success(`  Loaded model ${model}`);
}

function logAttributeOrRelationSet(eventType, targetName, modelName) {
  consola.success(
    `  Loaded ${eventType.padEnd(13, " ")} ${modelName}.${targetName}`
  );
}

function info(str) {
  consola.info(str);
}

function success(str) {
  consola.success(str);
}

function error(str) {
  consola.error(str);
}

export default {
  error,
  log,
  info,
  success,
  logRouteGen,
  logAttributeOrRelationSet,
  logModelLoaded,
};
