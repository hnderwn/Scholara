/**
 * Seed script for Tryout & Learning Recommendation System
 * This script helps populate the database with sample data
 *
 * Usage:
 * 1. Set up your Supabase project
 * 2. Update the Supabase URL and anon key in .env file
 * 3. Run: node seed.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Prefer Service Role Key for seeding to bypass RLS, otherwise fallback to Anon Key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseServiceKey) {
  console.warn('⚠️ WARNING: using Anon Key. Seeding might fail due to RLS policies.');
  console.warn('   Add SUPABASE_SERVICE_ROLE_KEY to your .env file to fix this.\n');
}

// Load sample data
const sampleData = JSON.parse(fs.readFileSync('./sample-data.json', 'utf8'));

async function seedDatabase() {
  console.log('Starting database seeding...\n');

  try {
    // Seed profiles (Note: These should be created through Supabase Auth first)
    console.log('1. Seeding profiles...');
    for (const profile of sampleData.profiles) {
      const { error } = await supabase.from('profiles').upsert(profile);
      if (error) {
        console.warn(`Warning: Could not insert profile ${profile.full_name}:`, error.message);
        console.log('Note: Profiles should be created automatically when users sign up through Supabase Auth');
      } else {
        console.log(`✓ Profile inserted: ${profile.full_name} (${profile.role})`);
      }
    }

    // Seed questions
    console.log('\n2. Seeding questions...');
    for (const question of sampleData.questions) {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          category: question.category,
          question_text: question.question_text,
          options: question.options,
          correct_answer: question.correct_answer,
          difficulty: question.difficulty || 1,
          weight: question.weight || 1,
        })
        .select();

      if (error) {
        console.error(`Error inserting question:`, error.message);
      } else {
        console.log(`✓ Question inserted: ${question.category} - ${question.question_text.substring(0, 50)}...`);
      }
    }

    // Seed exam results (requires existing users)
    console.log('\n3. Seeding exam results...');
    for (const result of sampleData.exam_results) {
      const { error } = await supabase.from('exam_results').insert({
        ...result,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`Error inserting exam result:`, error.message);
      } else {
        console.log(`✓ Exam result inserted for user ${result.user_id}: ${result.score_total}/100`);
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run dev');
    console.log('3. Open http://localhost:5173 in your browser');
    console.log('4. Sign in with your Supabase credentials');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seed script
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
