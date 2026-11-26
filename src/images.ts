import type { ImageSourcePropType } from "react-native";
import type { PromptImage } from "./programs";

const sources: Record<PromptImage, ImageSourcePropType> = {
  "cover-hard": require("../assets/prompts/cover-hard.jpg"),
  "cover-soft": require("../assets/prompts/cover-soft.jpg"),
  "cover-custom": require("../assets/prompts/cover-custom.jpg"),
  outdoor: require("../assets/prompts/cover-hard.jpg"),
  second: require("../assets/prompts/tile-evening.jpg"),
  diet: require("../assets/prompts/tile-bowl.jpg"),
  water: require("../assets/prompts/tile-water.jpg"),
  read: require("../assets/prompts/tile-book.jpg"),
  photo: require("../assets/prompts/tile-window.jpg"),
  train: require("../assets/prompts/tile-path.jpg"),
};

export function promptSource(image: PromptImage): ImageSourcePropType {
  return sources[image];
}

export function coverFor(program: "hard" | "soft" | "custom"): ImageSourcePropType {
  if (program === "hard") return sources["cover-hard"];
  if (program === "soft") return sources["cover-soft"];
  return sources["cover-custom"];
}
