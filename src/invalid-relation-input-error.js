export default class InvalidRelationInputError extends Error {
  constructor(relations) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);
    const strigifiedRelations = Object.entries(relations).map(
      ([index, missingFields]) => `${index}: ${missingFields.join(", ")}`
    );

    this.message = `Required fields missing for relations`.concat(
      "\n  ",
      strigifiedRelations.join("\n  ")
    );
  }
}
