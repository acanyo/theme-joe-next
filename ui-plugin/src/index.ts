import { definePlugin } from "@halo-dev/ui-shared";
import AuthorWeather from "./AuthorWeather.vue";

export default definePlugin({
  // Halo only collects formkit.inputs from plugin providers, not themes.
  // Annotation settings use the standard text input with this component in its inner section.
  components: {
    JoeNextAuthorWeather: AuthorWeather,
  },
});
