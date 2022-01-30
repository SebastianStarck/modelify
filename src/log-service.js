import consola from "consola";

function log(str) {
  consola.log(str);
}

function info(str) {
  consola.info(str);
}

function success(str) {
  consola.success(str);
}

export default { log, info, success };
