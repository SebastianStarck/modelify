export default class Model {
  name;
  fields = [];
  relations = [];

  constructor(name, fields) {
    this.name = name;
    this.fields = fields;
  }
}
