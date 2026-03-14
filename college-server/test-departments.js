// Quick test to verify the departments/teachers endpoint
const axios = require('axios');

async function test() {
  try {
    // First, login to get a token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'hod@college.com',
      password: 'hod123456'
    });

    const token = loginRes.data.token;
    console.log('✓ Logged in as HOD, got token:', token.substring(0, 20) + '...');

    // Try to fetch departments
    const deptsRes = await axios.get('http://localhost:5000/api/departments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const dept = deptsRes.data.departments[0];
    console.log('✓ Fetched departments, first dept:', dept.id, dept.name);

    // Now try to fetch teachers for that department
    const teachersUrl = `http://localhost:5000/api/departments/${dept.id}/teachers`;
    console.log('\n📍 Attempting to fetch:', teachersUrl);

    const teachersRes = await axios.get(teachersUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✓ Success! Got teachers:', teachersRes.data.teachers.length);
    const teachers = teachersRes.data.teachers;
    teachers.forEach(t => {
      console.log(`  - ${t.name} (${t.email}) - ${t.total_classes} classes, ${t.total_students} students`);
    });

    // Test teacher performance endpoint
    if (teachers.length > 0) {
      const teacher = teachers[0];
      const perfUrl = `http://localhost:5000/api/departments/${dept.id}/teacher/${teacher.id}/performance`;
      console.log('\n📍 Attempting to fetch teacher performance:', perfUrl);

      const perfRes = await axios.get(perfUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('✓ Success! Got teacher performance:', perfRes.data.classes.length, 'classes');
      perfRes.data.classes.forEach(c => {
        console.log(`  - ${c.name}: avg ${c.avg_percentage}%, ${c.enrolled_students} students, ${c.avg_attendance_pct}% attendance`);
      });
    }

  } catch (err) {
    console.error('✗ Error:', err.response?.status, err.response?.data || err.message);
  }
}

test();

