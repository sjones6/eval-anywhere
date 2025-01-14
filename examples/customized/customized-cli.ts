import z from "zod";
import { anywhere } from "../../src";

anywhere({
  schemaPath: "./examples/with_custom_check_prompt_schema.json",
})
  .addEvaluationCheck(
    z.object({
      id: z.literal("is_bird"),
      name: z.string().optional(),
      known_birds: z.array(z.string()).min(1),
    }),
    (result, { check, config }) => {
      if (result.type !== "text") {
        config.logger.info("is bird check does not support non-text results");
        return {
          success: false,
          data: {
            result,
          },
        };
      }
      return {
        success: !!check.known_birds.find((bird) =>
          result.text.toLowerCase().includes(bird.toLowerCase()),
        ),
        data: {
          text: result,
          birds: check.known_birds,
        },
      };
    },
  )
  .run();
