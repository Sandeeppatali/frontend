import express from "express";
import Booking from "../models/Booking.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create booking
router.post("/", auth(), async (req, res) => {
  try {
    const { date, classroom, time } = req.body;
    
    // Debug logging
    console.log("Booking request:", { date, classroom, time });
    console.log("User from auth:", req.user);
    
    // Validate input
    if (!date || !classroom || !time) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        details: "Date, classroom, and time are required" 
      });
    }

    // Validate user ID - handle different possible field names
    const userId = req.user.userId || req.user.id || req.user._id || req.user.sub;
    if (!req.user || !userId) {
      return res.status(401).json({ 
        error: "Authentication error", 
        details: "User ID not found in token. Available fields: " + Object.keys(req.user).join(', ')
      });
    }

    // Check if the slot is already booked
    const existingBooking = await Booking.findOne({
      date: new Date(date),
      classroom,
      time
    });

    if (existingBooking) {
      return res.status(400).json({ 
        error: "Slot already booked", 
        details: "This time slot is not available" 
      });
    }

    // Create new booking
    const booking = new Booking({
      date: new Date(date),
      classroom,
      time,
      user: userId
    });

    console.log("Creating booking with data:", booking.toObject());

    const savedBooking = await booking.save();
    
    console.log("Booking saved successfully:", savedBooking._id);
    
    // Return the booking data for display
    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        _id: savedBooking._id,
        date: savedBooking.date,
        classroom: savedBooking.classroom,
        time: savedBooking.time
      }
    });

  } catch (err) {
    console.error("Booking error:", err);
    
    // More detailed error handling
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors.join(', ')
      });
    }
    
    res.status(500).json({ 
      error: "Booking failed", 
      details: err.message 
    });
  }
});

// Get user bookings
router.get("/mine", auth(), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id || req.user.sub;
    
    const bookings = await Booking.find({ user: userId })
      .sort({ date: 1, time: 1 })
      .select('date classroom time');
    
    res.json(bookings);
  } catch (err) {
    console.error("Fetch bookings error:", err);
    res.status(500).json({ 
      error: "Failed to fetch bookings",
      details: err.message 
    });
  }
});

// Get all bookings for a specific date and classroom (for checking availability)
router.get("/availability", auth(), async (req, res) => {
  try {
    const { date, classroom } = req.query;
    
    if (!date || !classroom) {
      return res.status(400).json({ 
        error: "Date and classroom are required" 
      });
    }

    const bookings = await Booking.find({
      date: new Date(date),
      classroom
    }).select('time');

    const bookedTimes = bookings.map(b => b.time);
    
    res.json({ bookedTimes });
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ 
      error: "Failed to check availability",
      details: err.message 
    });
  }
});

// Delete a booking (optional - for cancellation)
router.delete("/:id", auth(), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id || req.user.sub;
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!booking) {
      return res.status(404).json({ 
        error: "Booking not found or you don't have permission to delete it" 
      });
    }

    await Booking.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ 
      error: "Failed to cancel booking",
      details: err.message 
    });
  }
});

export default router;