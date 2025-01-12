# Crouton recipe -> Schema.org Recipe converter

> TypeScript library for converting [Crouton](https://crouton.app/) recipes to the [Schema.org Recipe definition](https://schema.org/Recipe).

## Setup

0. Ensure you have Node.js v20.x installed on your system (running `$ node -v` should output a version number like `v20.11.0`).
1. Clone this repo
2. Run `npm install`

## Usage

1. Place your exported Crouton files into the `/assets/recipes` directory (e.g. `/assets/recipes/recipe1.crumb`).
2. Run `npm run convert` to convert all Crouton recipes to Schema.org Recipe JSON-LD files.
3. Find your output in the `/output` directory.

## Why?

I wanted to migrate my recipes from [Crouton](https://crouton.app/) to [Mealie](https://mealie.io/). Mealie doesn't have a migration script for Crouton (just yet), but they do support importing the [Schema.org Recipe definition](https://schema.org/Recipe), via the [Nexcloud Cookbook](https://apps.nextcloud.com/apps/cookbook) migrator.

This library converts Crouton recipes to the Schema.org Recipe definition (structured as if they were a Nextcloud Cookbook export), so that they can be imported into Mealie.
