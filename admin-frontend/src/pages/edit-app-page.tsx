import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAppDetails, updateApp } from "../api/api";

const schema = z.object({
  client_name: z.string().min(1, "App name is required"),
  redirect_uris: z
    .array(z.string().url("Invalid URL"))
    .min(1, "At least one redirect URI is required"),
  post_logout_redirect_uris: z.array(z.string().url("Invalid URL")),
  response_types: z
    .array(z.enum(["code", "token", "id_token"]))
    .min(1, "At least one response type is required"),
});

type FormFields = z.infer<typeof schema>;

const EditApp: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      redirect_uris: [""],
      post_logout_redirect_uris: [""],
      response_types: [],
    },
  });

  const {
    fields: redirectUriFields,
    append: appendRedirectUri,
    remove: removeRedirectUri,
  } = useFieldArray({
    control,
    name: "redirect_uris",
  });

  const {
    fields: postLogoutRedirectUriFields,
    append: appendPostLogoutRedirectUri,
    remove: removePostLogoutRedirectUri,
  } = useFieldArray({
    control,
    name: "post_logout_redirect_uris",
  });

  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        const appDetails = await getAppDetails(appId!);
        setValue("client_name", appDetails.client_name);
        setValue("redirect_uris", appDetails.redirectUris);
        setValue("post_logout_redirect_uris", appDetails.postLogoutRedirectUris);
        setValue("response_types", appDetails.responseTypes);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching app details:", error);
        navigate("/client");
      }
    };

    fetchAppDetails();
  }, [appId, setValue, navigate]);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await updateApp(appId!, data);
      navigate("/client");
    } catch (error) {
      console.error("Error updating app:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Edit App</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="client_name" className="block mb-2">
            App Name
          </label>
          <input
            {...register("client_name")}
            id="client_name"
            type="text"
            className="w-full p-2 border rounded"
          />
          {errors.client_name && (
            <span className="text-red-500 text-sm">
              {errors.client_name.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Redirect URIs</label>
          {redirectUriFields.map((field, index) => (
            <div key={field.id} className="flex mb-2">
              <input
                {...register(`redirect_uris.${index}`)}
                type="url"
                className="flex-grow p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removeRedirectUri(index)}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendRedirectUri("")}
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
          >
            Add Redirect URI
          </button>
          {errors.redirect_uris && (
            <span className="text-red-500 text-sm">
              {errors.redirect_uris.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Post-Logout Redirect URIs</label>
          {postLogoutRedirectUriFields.map((field, index) => (
            <div key={field.id} className="flex mb-2">
              <input
                {...register(`post_logout_redirect_uris.${index}`)}
                type="url"
                className="flex-grow p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removePostLogoutRedirectUri(index)}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendPostLogoutRedirectUri("")}
            className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
          >
            Add Post-Logout Redirect URI
          </button>
          {errors.post_logout_redirect_uris && (
            <span className="text-red-500 text-sm">
              {errors.post_logout_redirect_uris.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2">Response Types</label>
          <div>
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                {...register("response_types")}
                value="code"
                className="form-checkbox"
              />
              <span className="ml-2">Code</span>
            </label>
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                {...register("response_types")}
                value="token"
                className="form-checkbox"
              />
              <span className="ml-2">Token</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register("response_types")}
                value="id_token"
                className="form-checkbox"
              />
              <span className="ml-2">ID Token</span>
            </label>
          </div>
          {errors.response_types && (
            <span className="text-red-500 text-sm">
              {errors.response_types.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update App"}
        </button>
      </form>
    </div>
  );
};

export default EditApp;
