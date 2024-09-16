import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

type FormFields = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await registerUser(data);
      //   await new Promise((resolve) => setTimeout(resolve, 1000));

      //   throw new Error("username is already taken.");

      //   alert(JSON.stringify(data));
      navigate("/login");
    } catch (error) {
      setError("username", {
        message: "username is already taken.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Register Form</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2 w-96"
        >
          <input
            {...register("username")}
            className="border w-full rounded-md p-4"
            type="text"
            placeholder="username"
          />
          {errors.username && (
            <span className="text-xs text-red-600 font-semibold">
              {errors.username.message}
            </span>
          )}
          <input
            {...register("password")}
            className="border w-full rounded-md p-4"
            type="password"
            placeholder="Password"
          />
          {errors.password && (
            <span className="text-xs text-red-600 font-semibold">
              {errors.password.message}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Loading..." : "Register"}
          </button>
        </form>
      </div>
    </>
  );
}
