import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { Test, Psychologist, UserRole } from '../entities';
import { QUESTIONS, TEST_TITLE, TEST_DESCRIPTION } from './questions.data';

async function seed() {
  await AppDataSource.initialize();

  const psychologistRepo = AppDataSource.getRepository(Psychologist);
  const existingAdmin = await psychologistRepo.findOne({
    where: { username: 'admin' },
  });
  if (!existingAdmin) {
    await psychologistRepo.save(
      psychologistRepo.create({
        fullName: 'Dilshod Rahimov',
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
      }),
    );
    console.log('Admin yaratildi: admin / admin123');
  }

  const testRepo = AppDataSource.getRepository(Test);
  const existingTest = await testRepo.findOne({
    where: { title: TEST_TITLE },
  });
  if (!existingTest) {
    await testRepo.save(
      testRepo.create({
        title: TEST_TITLE,
        description: TEST_DESCRIPTION,
        isActive: true,
        questions: QUESTIONS,
      }),
    );
    console.log(`Test yaratildi: ${TEST_TITLE}`);
  } else {
    existingTest.description = TEST_DESCRIPTION;
    existingTest.questions = QUESTIONS;
    await testRepo.save(existingTest);
    console.log(`Test yangilandi: ${TEST_TITLE}`);
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
