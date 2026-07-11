const answer = "heart";

document.getElementById("password-submit")?.addEventListener("click", () => {
  const input = document.getElementById("password-input");
  const value = input?.value?.trim().toLowerCase();
  const message = document.createElement("p");
  message.className = "text-center font-bold";
  message.textContent = value === answer ? "Correct. Return to LumaLearn to continue the heart lesson." : "Try again. Look closely at the model labels.";
  document.getElementById("password")?.appendChild(message);
});
