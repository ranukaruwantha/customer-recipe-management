const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Recipe = require('../models/recipeModel');
const authMiddleware = require('../middleware/authMiddleware');
const recipeController = require('../controllers/recipeController');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where images will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
    },
});

const upload = multer({ storage });

// Add a new recipe with image upload
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    const { title, description, ingredients, instructions } = req.body;
    const image = req.file ? req.file.path : null; // Get the path of the uploaded image

    try {
        const newRecipe = new Recipe({
            title,
            description,
            ingredients,
            instructions,
            image,
            userId: req.user.id,
        });

        const savedRecipe = await newRecipe.save();
        res.status(201).json(savedRecipe);
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(400).json({ message: 'Failed to create recipe', error });
    }
});


// Fetch recipes for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const recipes = await Recipe.find({ userId: req.user.id }); // Adjust this query based on your model
        res.json(recipes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// Get a specific recipe by ID
router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update a recipe
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedRecipe) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        res.status(200).json(updatedRecipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(400).json({ msg: 'Failed to update recipe', error });
    }
});


// Delete a recipe
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);

        if (!deletedRecipe) {
            return res.status(404).json({ msg: 'Recipe not found' });
        }

        res.status(200).json({ msg: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(400).json({ msg: 'Failed to delete recipe', error });
    }
});

module.exports = router;

router.get('/search', authMiddleware, recipeController.searchRecipesByTitle);

