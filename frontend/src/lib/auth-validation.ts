import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 해요"),
});

export const registerSchema = z.object({
  display_name: z
    .string()
    .min(1, "여행자 이름을 알려주세요")
    .max(50, "이름은 50자까지 가능해요"),
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 해요"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
