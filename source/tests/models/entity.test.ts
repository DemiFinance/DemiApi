import { Entity, Individual } from '../../models/entity';
describe('Entity Model', () => {
  test('Entity interface', () => {
    const entity: Entity = {
      type: 'test',
      individual: {
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        email: 'john.doe@example.com',
        dob: '2000-01-01',
      },
    };
    expect(entity).toBeTruthy();
  });
  test('Individual interface', () => {
    const individual: Individual = {
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      email: 'john.doe@example.com',
      dob: '2000-01-01',
    };
    expect(individual).toBeTruthy();
  });
});


