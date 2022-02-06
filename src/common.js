import logService from "./log-service.js";

const EXTRA_SPACE = 0;
function serializeStringCollectionSpacing(
  collection,
  extraSpace = EXTRA_SPACE
) {
  const splittedCollection = collection.map((item) => item.split(" "));

  const maxWordsLength = splittedCollection
    .map((splittedString) => splittedString.map((word) => word.length))
    .reduce((currentMaxWordLenghts, currentStr) => {
      return currentStr.map((currentMaxLength, index) => {
        return Math.max(currentMaxLength, currentMaxWordLenghts[index] || 0);
      });
    }, []);

  return splittedCollection.map((splittedString) =>
    splittedString.reduce((result, word, index) => {
      const isLast = index === splittedString.length - 1;
      return result.concat(
        " ",
        isLast ? word : word.padEnd(maxWordsLength[index] + extraSpace)
      );
    }, "")
  );
}

function stopAppWithError(message) {
  logService.error(message);
  logService.log("Exiting now...");
  process.exit(0);
}

export default {
  serializeStringCollectionSpacing,
  stopAppWithError,
};
