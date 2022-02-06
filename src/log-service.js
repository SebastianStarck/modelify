import consola from "consola";
import consts from "./consts.js";

// TODO: Implement logging to file maybe?
function log(str) {
  consola.log(str);
}

function logRouteGen(method, route) {
  consola.success(
    ` ${method.padStart(consts.CONSOLE_ROUTE_METHOD_SPACE, " ")} ${route.padEnd(
      consts.CONSOLE_ROUTE_NAME_SPACE,
      " "
    )} created`
  );
}

function logModelLoaded(model) {
  consola.success(`${consts.CONSOLE_SUBSTATEMENT_SPACE}Loaded model ${model}`);
}

function logAttributeOrRelationSet(eventType, targetName, modelName) {
  consola.success(
    `${consts.CONSOLE_SUBSTATEMENT_SPACE}Loaded ${eventType} ${modelName}.${targetName}`
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

function warning(str) {
  consola.warn(str);
}

export default {
  error,
  log,
  info,
  success,
  logRouteGen,
  logAttributeOrRelationSet,
  logModelLoaded,
  warning,
};
