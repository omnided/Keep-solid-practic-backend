export type doctor = {
  id: number;
  doctor_fullname: string;
  doctor_number: string;  // ← может быть null
  doctor_office: number;
  specialty: {
    id: number;
    specialty_name: string;  // ← ДЛЯ ОТОБРАЖЕНИЯ!
  };
};

export type MutateDoctorRequest = {
  id: number;
  doctor_fullname: string;
  doctor_number: string;
  doctor_office: number;
  specialty_id: number; 
};

export type User = {
  id: number;
  username: string;
  email: string;
  roles: string[];
};
