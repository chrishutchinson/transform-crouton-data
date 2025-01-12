import fs from "node:fs/promises";
import path from "node:path";
import z, { TypeOf } from "zod";
import Progress from "ts-progress";

const loadRecipes = async () => {
  const filePaths = await fs.readdir(
    path.resolve(__dirname, "../assets/recipes")
  );
  const recipeFileName = filePaths.filter((filePath) =>
    filePath.endsWith(".crumb")
  );

  const recipeFiles = await Promise.all(
    recipeFileName.map(async (fileName) => {
      const recipeFile = await fs.readFile(
        path.resolve(__dirname, "../assets/recipes", fileName),
        "utf-8"
      );

      const safeName = fileName.replace(/\|/g, "-").replace(".crumb", "");

      return {
        name: safeName,
        content: JSON.parse(recipeFile),
      };
    })
  );

  return recipeFiles;
};

const recipeValidator = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("Recipe"),
  name: z.string(),
  image: z.array(z.string()),
  author: z
    .object({
      "@type": z.literal("Person"),
      name: z.string(),
    })
    .optional(),
  datePublished: z.string().optional(),
  description: z.string().optional(),
  recipeCuisine: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  keywords: z.string().optional(),
  recipeYield: z.string().optional(),
  recipeCategory: z.string().optional(),
  nutrition: z
    .object({
      "@type": z.literal("NutritionInformation"),
      calories: z.string().optional(),
      carbohydrateContent: z.string().optional(),
      cholesterolContent: z.string().optional(),
      fatContent: z.string().optional(),
      fiberContent: z.string().optional(),
      proteinContent: z.string().optional(),
      saturatedFatContent: z.string().optional(),
      servingSize: z.string().optional(),
      sodiumContent: z.string().optional(),
      sugarContent: z.string().optional(),
      transFatContent: z.string().optional(),
      unsaturatedFatContent: z.string().optional(),
    })
    .optional(),
  aggregateRating: z
    .object({
      "@type": z.literal("AggregateRating"),
      ratingValue: z.string(),
      reviewCount: z.string(),
    })
    .optional(),
  recipeIngredient: z.array(z.string()).optional(),
  recipeInstructions: z
    .array(
      z.object({
        "@type": z.literal("HowToStep"),
        name: z.string().optional(),
        text: z.string().optional(),
        url: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .optional(),
});

const getPrepTime = (recipe: any) => {
  if (recipe.preparationTime) {
    return recipe.preparationTime;
  }

  if (recipe.duration && recipe.cookingDuration) {
    return recipe.cookingDuration - recipe.duration;
  }

  return undefined;
};

const getQuantityType = (value: any) => {
  if (value === "GRAMS") {
    return "g";
  }

  if (value === "KGS") {
    return "kg";
  }

  if (value === "LITRES") {
    return "l";
  }

  if (value === "MILLS") {
    return "ml";
  }

  if (value === "ITEM") {
    return "";
  }

  if (value === "PINCH") {
    return " pinch";
  }

  if (value === "TABLESPOON") {
    return "tbsp";
  }

  if (value === "TEASPOON") {
    return "tsp";
  }

  if (value === "CUP") {
    return " cup";
  }

  return value;
};

type Recipe = TypeOf<typeof recipeValidator>;

const createRecipeStructure = (recipe: any): Recipe => {
  const prepTime = getPrepTime(recipe);
  const cookTime = recipe.cookingDuration;
  const totalTime =
    recipe.duration || (prepTime && cookTime ? prepTime + cookTime : undefined);

  const [firstImage] = recipe.images;

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    image: firstImage
      ? [`data:image/jpeg;base64,${firstImage.replaceAll("/", "/")}`]
      : [],
    prepTime: prepTime ? `PT${prepTime}M` : undefined,
    cookTime: cookTime ? `PT${cookTime}M` : undefined,
    totalTime: totalTime ? `PT${totalTime}M` : undefined,
    recipeYield: recipe.serves ? `${recipe.serves} servings` : undefined,
    recipeIngredient: recipe.ingredients
      .map((i: any) => {
        const { ingredient, quantity } = i;

        if (ingredient.name === "") {
          return null;
        }

        return `${
          quantity
            ? `${quantity.amount}${getQuantityType(quantity.quantityType)} `
            : ""
        }${ingredient.name.toLowerCase()}`;
      })
      .filter(Boolean),
    recipeInstructions: recipe.steps.map((step: any) => ({
      "@type": "HowToStep",
      text: step.step,
    })),
  };
};

const writeRecipeImages = async (recipe: Recipe, folderName: string) => {
  const [firstImage] = recipe.image;

  if (!firstImage) {
    return;
  }

  // Image is a data:image/jpeg;base64
  const image = firstImage.split(",")[1];
  const buffer = Buffer.from(image, "base64");

  await fs.writeFile(
    path.resolve(__dirname, `../output/${folderName}`, `full.jpg`),
    buffer
  );
};

const main = async () => {
  const recipes = await loadRecipes();
  const progress = Progress.create({ total: recipes.length });

  await fs.mkdir(path.resolve(__dirname, `../output`), {
    recursive: true,
  });

  for (const { content, name } of recipes) {
    const recipe = createRecipeStructure(content);

    await fs.mkdir(path.resolve(__dirname, `../output/${name}`), {
      recursive: true,
    });

    await writeRecipeImages(recipe, name);

    await fs.writeFile(
      path.resolve(__dirname, `../output/${name}`, `recipe.json`),
      JSON.stringify(recipe)
    );

    progress.update();
  }

  progress.done();
};

main();
