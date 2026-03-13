#!/usr/bin/env node

/**
 * Comprehensive database seeder for college management system
 * Generates realistic test data covering all API routes and relationships
 *
 * Usage: node seed.js
 *
 * Creates:
 * - 1 admin user (email: admin@college.com)
 * - 4 departments with HODs (teachers with hod role)
 * - 2 semesters (1 past, 1 active)
 * - 8 teachers (2 per department)
 * - 16 classes (2 per teacher)
 * - 160 students (10 per class)
 * - Enrollments, attendance, marks, announcements, and schedules for all
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

// ──────────────────────────────────────────────
// CONFIG & SETUP
// ──────────────────────────────────────────────

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "dnyanesh",
  database: process.env.DB_NAME || "college_db",
});

// Seed data sizes
const SEED_CONFIG = {
  admins: 1,
  departments: 4,
  semesters: 2,
  teachersPerDept: 2,
  classesPerTeacher: 2,
  studentsPerClass: 10,
};

// Calculate totals
const TOTALS = {
  departments: SEED_CONFIG.departments,
  teachers: SEED_CONFIG.departments * SEED_CONFIG.teachersPerDept,
  classes: SEED_CONFIG.departments * SEED_CONFIG.teachersPerDept * SEED_CONFIG.classesPerTeacher,
  students: SEED_CONFIG.departments * SEED_CONFIG.teachersPerDept * SEED_CONFIG.classesPerTeacher * SEED_CONFIG.studentsPerClass,
};

// ──────────────────────────────────────────────
// UTILITY FUNCTIONS
// ──────────────────────────────────────────────

/**
 * Generate a random string of given length
 */
function randomString(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date between start and end
 */
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Format time as HH:MM:SS
 */
function formatTime(hours, minutes = 0, seconds = 0) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Execute query and return results
 */
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error("Query error:", err.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    throw err;
  }
}

/**
 * Print a formatted table
 */
function printTable(headers, rows) {
  const colWidths = headers.map((h) => Math.max(h.length, ...rows.map((r) => String(r[headers.indexOf(h)]).length)));

  console.log("");
  console.log(
    headers
      .map((h, i) => h.padEnd(colWidths[i]))
      .join(" | ")
  );
  console.log(
    headers
      .map((_, i) => "─".repeat(colWidths[i]))
      .join("─┼─")
  );

  rows.forEach((row) => {
    console.log(
      headers
        .map((h, i) => String(row[h]).padEnd(colWidths[i]))
        .join(" | ")
    );
  });
  console.log("");
}

// ──────────────────────────────────────────────
// SEED FUNCTIONS
// ──────────────────────────────────────────────

async function seedUsers() {
  console.log("🌱 Seeding users...");

  const users = [];
  const userDocs = [];

  // Admin
  const adminPassword = "admin123456";
  const adminEmail = "admin@college.com";
  const adminHash = await hashPassword(adminPassword);
  const adminResult = await query(
    `INSERT INTO users (email, password_hash, role, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING id, email, role`,
    [adminEmail, adminHash, "admin"]
  );
  users.push(adminResult[0].id);
  userDocs.push({
    email: adminEmail,
    password: adminPassword,
    role: "admin",
    name: "Admin User",
  });

  console.log(`  ✓ Admin: ${adminEmail}`);

  return { adminUserId: users[0], users, userDocs };
}

async function seedDepartments() {
  console.log("🌱 Seeding departments...");

  const departments = [];
  const departmentNames = [
    "Computer Science",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
  ];

  for (const name of departmentNames) {
    const result = await query(
      `INSERT INTO departments (name) VALUES ($1) RETURNING id, name`,
      [name]
    );
    departments.push(result[0]);
    console.log(`  ✓ Department: ${name}`);
  }

  return departments;
}

async function seedSemesters() {
  console.log("🌱 Seeding semesters...");

  const semesters = [];

  // Past semester
  const pastStart = new Date(2025, 0, 1); // Jan 1, 2025
  const pastEnd = new Date(2025, 5, 30); // Jun 30, 2025
  const pastResult = await query(
    `INSERT INTO semesters (name, academic_year, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4, false)
     RETURNING id, name, is_active`,
    ["Semester 1", "2024-2025", formatDate(pastStart), formatDate(pastEnd)]
  );
  semesters.push(pastResult[0]);
  console.log(`  ✓ Past Semester: ${pastResult[0].name}`);

  // Active semester
  const activeStart = new Date(2025, 6, 1); // Jul 1, 2025
  const activeEnd = new Date(2025, 11, 31); // Dec 31, 2025
  const activeResult = await query(
    `INSERT INTO semesters (name, academic_year, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, is_active`,
    ["Semester 2", "2025-2026", formatDate(activeStart), formatDate(activeEnd)]
  );
  semesters.push(activeResult[0]);
  console.log(`  ✓ Active Semester: ${activeResult[0].name}`);

  return semesters;
}

async function seedSubjects() {
  console.log("🌱 Seeding subjects...");

  const subjectNames = [
    "Data Structures",
    "Algorithms",
    "Database Systems",
    "Web Development",
    "Operating Systems",
    "Computer Networks",
    "Machine Learning",
    "Cloud Computing",
    "Thermodynamics",
    "Fluid Mechanics",
    "Circuit Theory",
    "Power Systems",
    "Structural Analysis",
    "Soil Mechanics",
    "Water Resources",
    "Transportation Engineering",
  ];

  const subjects = [];
  for (const name of subjectNames) {
    const result = await query(
      `INSERT INTO subjects (name) VALUES ($1) RETURNING id, name`,
      [name]
    );
    subjects.push(result[0]);
  }

  console.log(`  ✓ Created ${subjects.length} subjects`);
  return subjects;
}

async function seedTeachersAndClasses(departments, subjects) {
  console.log("🌱 Seeding teachers and classes...");

  const teachers = [];
  const classes = [];
  const teacherUserDocs = [];
  const firstNames = [
    "James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda",
  ];
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  ];

  let subjectIndex = 0;

  for (const dept of departments) {
    for (let i = 0; i < SEED_CONFIG.teachersPerDept; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `teacher${teachers.length + 1}@college.com`;
      const password = `teacher${teachers.length + 1}pass123`;

      const passwordHash = await hashPassword(password);

      // Create user
      const userResult = await query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, email`,
        [email, passwordHash, "teacher"]
      );

      // Create teacher profile
      const teacherResult = await query(
        `INSERT INTO teachers (name, user_id, department_id)
         VALUES ($1, $2, $3)
         RETURNING id, name`,
        [name, userResult[0].id, dept.id]
      );

      teachers.push(teacherResult[0]);
      teacherUserDocs.push({
        email,
        password,
        role: "teacher",
        name,
      });

      // Set teacher as HOD for first teacher in each department
      if (i === 0) {
        await query(
          `UPDATE departments SET hod_id = $1 WHERE id = $2`,
          [teacherResult[0].id, dept.id]
        );
        console.log(`  ✓ Teacher (HOD): ${name} - ${email}`);
      } else {
        console.log(`  ✓ Teacher: ${name} - ${email}`);
      }

      // Create classes for this teacher
      for (let j = 0; j < SEED_CONFIG.classesPerTeacher; j++) {
        const subject = subjects[subjectIndex % subjects.length];
        const year = randomInt(1, 4);
        const className = `${subject.name} - Section ${String.fromCharCode(65 + j)}`;

        const classResult = await query(
          `INSERT INTO classes (name, subject_id, teacher_id, year)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name`,
          [className, subject.id, teacherResult[0].id, year]
        );

        classes.push({
          ...classResult[0],
          teacher_id: teacherResult[0].id,
          subject_id: subject.id,
          year,
        });

        subjectIndex++;
      }
    }
  }

  console.log(`  ✓ Created ${teachers.length} teachers and ${classes.length} classes`);
  return { teachers, classes, teacherUserDocs };
}

async function seedStudents(classes, activeSemester) {
  console.log("🌱 Seeding students...");

  const students = [];
  const studentUserDocs = [];
  const firstNames = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
    "Ivy", "Jack", "Karen", "Leo", "Mike", "Nancy", "Oscar", "Paula",
  ];
  const lastNames = [
    "Anderson", "Bailey", "Clark", "Davis", "Evans", "Foster", "Grant", "Harris",
  ];

  let studentCount = 0;

  for (const cls of classes) {
    for (let i = 0; i < SEED_CONFIG.studentsPerClass; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const rollNo = `STU${String(studentCount + 1).padStart(6, "0")}`;
      const email = `student${studentCount + 1}@college.com`;
      const password = `student${studentCount + 1}pass123`;

      const passwordHash = await hashPassword(password);

      // Create user
      const userResult = await query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, email`,
        [email, passwordHash, "student"]
      );

      // Create student profile
      const studentResult = await query(
        `INSERT INTO students (name, roll_no, user_id, class_id, year)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, roll_no`,
        [name, rollNo, userResult[0].id, cls.id, cls.year]
      );

      students.push({
        ...studentResult[0],
        user_id: userResult[0].id,
        class_id: cls.id,
      });

      studentUserDocs.push({
        email,
        password,
        role: "student",
        name,
      });

      studentCount++;
    }
  }

  console.log(`  ✓ Created ${students.length} students`);
  return { students, studentUserDocs };
}

async function seedEnrollments(classes, students, activeSemester) {
  console.log("🌱 Seeding enrollments...");

  let enrollmentCount = 0;

  for (const cls of classes) {
    // Get students for this class
    const classStudents = students.filter((s) => s.class_id === cls.id);

    for (const student of classStudents) {
      // 80% approved, 10% pending, 10% rejected
      const rand = Math.random();
      let status = "approved";
      if (rand < 0.1) {
        status = "pending";
      } else if (rand < 0.2) {
        status = "rejected";
      }

      await query(
        `INSERT INTO class_enrollments (class_id, student_id, semester_id, status)
         VALUES ($1, $2, $3, $4)`,
        [cls.id, student.id, activeSemester.id, status]
      );

      enrollmentCount++;
    }
  }

  console.log(`  ✓ Created ${enrollmentCount} enrollments`);
}

async function seedMarks(classes, students, teachers, activeSemester, subjects) {
  console.log("🌱 Seeding marks...");

  let markCount = 0;
  const examTypes = ["internal", "midterm", "final"];

  for (const cls of classes) {
    const classStudents = students.filter((s) => s.class_id === cls.id);
    const classTeacher = teachers.find((t) => t.id === cls.teacher_id);

    for (const examType of examTypes) {
      for (const student of classStudents) {
        // 80% have marks, 20% don't
        if (Math.random() < 0.8) {
          const score = randomInt(20, 100);
          const totalMarks = 100;

          await query(
            `INSERT INTO marks (class_id, student_id, subject_id, teacher_id, semester_id, score, total_marks, exam_type, year)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              cls.id,
              student.id,
              cls.subject_id,
              classTeacher.id,
              activeSemester.id,
              score,
              totalMarks,
              examType,
              cls.year,
            ]
          );

          markCount++;
        }
      }
    }
  }

  console.log(`  ✓ Created ${markCount} mark entries`);
}

async function seedAttendance(classes, students, activeSemester) {
  console.log("🌱 Seeding attendance...");

  let attendanceCount = 0;
  const startDate = new Date(2025, 6, 1); // Jul 1, 2025
  const endDate = new Date(2025, 7, 31); // Aug 31, 2025

  for (const cls of classes) {
    const classStudents = students.filter((s) => s.class_id === cls.id);

    // Generate 40 attendance records per class
    for (let i = 0; i < 40; i++) {
      const attDate = randomDate(startDate, endDate);
      // Skip Sundays
      if (attDate.getDay() === 0) {
        continue;
      }

      for (const student of classStudents) {
        // 80% present, 20% absent
        const status = Math.random() < 0.8 ? "present" : "absent";

        await query(
          `INSERT INTO attendance (class_id, student_id, semester_id, date, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (class_id, student_id, date) DO UPDATE SET status = $5`,
          [cls.id, student.id, activeSemester.id, formatDate(attDate), status]
        );

        attendanceCount++;
      }
    }
  }

  console.log(`  ✓ Created ${attendanceCount} attendance records`);
}

async function seedAnnouncements(classes, teachers) {
  console.log("🌱 Seeding announcements...");

  let announcementCount = 0;
  const announcementTitles = [
    "Important: Exam Schedule",
    "Assignment Submission Deadline",
    "Guest Lecture Announcement",
    "Lab Session Reschedule",
    "Project Review Meeting",
    "Library Timing Update",
    "Placement Drive Notice",
  ];

  for (const cls of classes) {
    const classTeacher = teachers.find((t) => t.id === cls.teacher_id);

    // 2-4 announcements per class
    const announcementCount_ = randomInt(2, 4);
    for (let i = 0; i < announcementCount_; i++) {
      const title = announcementTitles[Math.floor(Math.random() * announcementTitles.length)];
      const body = `${title} for ${cls.name}. Please check the details carefully and plan accordingly.`;

      await query(
        `INSERT INTO announcements (teacher_id, class_id, title, body)
         VALUES ($1, $2, $3, $4)`,
        [classTeacher.id, cls.id, title, body]
      );

      announcementCount++;
    }
  }

  console.log(`  ✓ Created ${announcementCount} announcements`);
}

async function seedClassSchedules(classes, teachers) {
  console.log("🌱 Seeding class schedules...");

  let scheduleCount = 0;
  const classStartDate = new Date(2025, 6, 1); // Jul 1, 2025
  const classEndDate = new Date(2025, 11, 31); // Dec 31, 2025
  const topics = [
    "Introduction to concepts",
    "Advanced topics",
    "Practical session",
    "Problem solving",
    "Case studies",
    "Project discussion",
  ];

  for (const cls of classes) {
    const classTeacher = teachers.find((t) => t.id === cls.teacher_id);
    const usedSlots = new Set(); // Track (date, startHour, endHour) combos

    // 20 scheduled sessions per class
    let attemptedSchedules = 0;
    let successfulSchedules = 0;

    while (successfulSchedules < 20 && attemptedSchedules < 100) {
      attemptedSchedules++;

      const sessionDate = randomDate(classStartDate, classEndDate);
      // Skip Sundays
      if (sessionDate.getDay() === 0) {
        continue;
      }

      const startHour = randomInt(9, 16);
      const endHour = startHour + randomInt(1, 2);
      const slotKey = `${formatDate(sessionDate)}|${startHour}|${endHour}`;

      // Skip if this slot already used for this class
      if (usedSlots.has(slotKey)) {
        continue;
      }

      usedSlots.add(slotKey);

      const topic = topics[Math.floor(Math.random() * topics.length)];
      const status = Math.random() < 0.9 ? "scheduled" : "cancelled";

      try {
        await query(
          `INSERT INTO class_schedules (class_id, session_date, start_time, end_time, topic, status, updated_by_teacher_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cls.id,
            formatDate(sessionDate),
            formatTime(startHour),
            formatTime(endHour),
            topic,
            status,
            classTeacher.id,
          ]
        );

        scheduleCount++;
        successfulSchedules++;
      } catch (err) {
        // If duplicate occurs (race condition), skip and try next
        if (err.code === "23505") {
          continue;
        }
        throw err;
      }
    }
  }

  console.log(`  ✓ Created ${scheduleCount} class schedules`);
}

// ──────────────────────────────────────────────
// MAIN SEED FUNCTION
// ──────────────────────────────────────────────

async function seed() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║       College Management System - Database Seeder               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    console.log("📊 Seed Configuration:");
    console.log(`  • Departments: ${SEED_CONFIG.departments}`);
    console.log(`  • Teachers per Department: ${SEED_CONFIG.teachersPerDept}`);
    console.log(`  • Total Teachers: ${TOTALS.teachers}`);
    console.log(`  • Classes per Teacher: ${SEED_CONFIG.classesPerTeacher}`);
    console.log(`  • Total Classes: ${TOTALS.classes}`);
    console.log(`  • Students per Class: ${SEED_CONFIG.studentsPerClass}`);
    console.log(`  • Total Students: ${TOTALS.students}\n`);

    // Clear existing data (in development only)
    console.log("🧹 Clearing existing data...");
    await query(`TRUNCATE TABLE class_schedules CASCADE`);
    await query(`TRUNCATE TABLE password_reset_tokens CASCADE`);
    await query(`TRUNCATE TABLE audit_logs CASCADE`);
    await query(`TRUNCATE TABLE announcements CASCADE`);
    await query(`TRUNCATE TABLE attendance CASCADE`);
    await query(`TRUNCATE TABLE marks CASCADE`);
    await query(`TRUNCATE TABLE class_enrollments CASCADE`);
    await query(`TRUNCATE TABLE classes CASCADE`);
    await query(`TRUNCATE TABLE subjects CASCADE`);
    await query(`TRUNCATE TABLE teachers CASCADE`);
    await query(`TRUNCATE TABLE students CASCADE`);
    await query(`TRUNCATE TABLE semesters CASCADE`);
    await query(`TRUNCATE TABLE departments CASCADE`);
    await query(`TRUNCATE TABLE users CASCADE`);
    console.log("  ✓ Database cleared\n");

    // Seed core data
    const { adminUserId, userDocs } = await seedUsers();
    const departments = await seedDepartments();
    const semesters = await seedSemesters();
    const subjects = await seedSubjects();
    const { teachers, classes, teacherUserDocs } = await seedTeachersAndClasses(
      departments,
      subjects
    );
    const { students, studentUserDocs } = await seedStudents(classes, semesters[1]);

    userDocs.push(...teacherUserDocs);
    userDocs.push(...studentUserDocs);

    // Seed relationships
    await seedEnrollments(classes, students, semesters[1]);
    await seedMarks(classes, students, teachers, semesters[1], subjects);
    await seedAttendance(classes, students, semesters[1]);
    await seedAnnouncements(classes, teachers);
    await seedClassSchedules(classes, teachers);

    // Print summary
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                    ✅ Seeding Complete                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("📋 Test User Credentials:\n");

    printTable(
      ["Email", "Password", "Role", "Name"],
      userDocs.map((u) => ({
        Email: u.email,
        Password: u.password,
        Role: u.role.toUpperCase(),
        Name: u.name,
      }))
    );

    console.log("📊 Summary Statistics:");
    console.log(`  • Total Users: ${userDocs.length}`);
    console.log(`  • Total Departments: ${TOTALS.departments}`);
    console.log(`  • Total Teachers: ${TOTALS.teachers}`);
    console.log(`  • Total Students: ${TOTALS.students}`);
    console.log(`  • Total Classes: ${TOTALS.classes}`);
    console.log(`  • Total Semesters: ${semesters.length}`);
    console.log(`  • Total Subjects: ${subjects.length}\n`);

    console.log("🎯 You can now login with any of the above credentials to test all features!\n");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    console.error(err);
    await pool.end();
    process.exit(1);
  }
}

// Run seeder
seed();

