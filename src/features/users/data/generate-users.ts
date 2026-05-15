import { faker } from "@faker-js/faker";
import type { User } from "./constants";
import { ROLES, STATUSES } from "./constants";

export function generateUsers(count: number): User[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    username: faker.internet.username(),
    role: faker.helpers.arrayElement([...ROLES]),
    status: faker.helpers.arrayElement([...STATUSES]),
    avatar: faker.image.avatar(),
    joinDate: faker.date.past({ years: 2 }).toISOString().split("T")[0],
  }));
}
