import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify() {
  if (configured || typeof window === "undefined") return;
  const region = "us-west-1";
  const userPoolId = "us-west-1_QwiKlZ8cs";
  const userPoolClientId = "60ph50n2pdo9b2h56f6u13osbp";
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
      },
    },
  });
  configured = true;
}

export function friendlyAuthError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  const message = (err as { message?: string })?.message ?? "Something went wrong.";
  switch (name) {
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "UserNotFoundException":
      return "No account found with that email.";
    case "UserNotConfirmedException":
      return "Your account isn't verified yet. Check your email for the code.";
    case "UsernameExistsException":
      return "An account with that email already exists.";
    case "CodeMismatchException":
      return "That confirmation code is incorrect.";
    case "ExpiredCodeException":
      return "That confirmation code has expired. Request a new one.";
    case "InvalidPasswordException":
      return "Password doesn't meet requirements (min 8 chars, upper, lower, number).";
    case "LimitExceededException":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return message;
  }
}