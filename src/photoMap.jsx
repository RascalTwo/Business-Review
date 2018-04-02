/**
 * Map expected and generated filepaths for files in context.
 *
 * @returns {Object} Mapped filepaths.
 */
export default (function mapFiles(context) {
  return context.keys().reduce((photos, filepath) => {
    Object.assign(photos, {
      [filepath.replace('./', '')]: context(filepath)
    });
    return photos;
  }, {});
}(require.context('./business_photos', false, /\.(png|jpe?g|svg)$/)));
