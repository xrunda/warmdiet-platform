import "./index.css";
import { Composition } from "remotion";
import { WarmDietPromo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WarmDietVerticalPromo"
        component={WarmDietPromo}
        durationInFrames={2700}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
