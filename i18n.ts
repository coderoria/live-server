import * as i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

i18n
  .use(
    resourcesToBackend((language, namespace, callback) => {
      import(`../locales/${language}.json`)
        .then((resources) => {
          callback(null, resources);
        })
        .catch((error) => {
          callback(error, null);
        });
    })
  )
  .init({
    lng: "en",
    fallbackLng: "en",
    debug: true,
  });
