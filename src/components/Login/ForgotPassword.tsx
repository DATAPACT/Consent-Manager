// libraries
import { useTranslation } from "react-i18next";

// css
import styles from "../../../css/CreateRequest.module.css";
import { useState } from "react";
import { forgotPassword } from "../../services/api";

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      try {
        await forgotPassword(email);
        // Redirect happens in useEffect
      } catch (err: any) {
        let errorMessage = t("login_error_message_1");
  
        if (err.code) {
          switch (err.code) {
            case "auth/user-not-found":
              errorMessage = t("login_error_message_2");
              break;
            case "auth/invalid-credential":
              errorMessage = t("login_error_message_3");
              break;
            case "auth/too-many-requests":
              errorMessage = t("login_error_message_4");
              break;
          }
        }
        alert(errorMessage);
      }
    };

  return (
    <>
      <div className={`${styles.dashboard} container w-50`}>
        <div className="text-center">
          <img
            src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
            className="rounded-circle mb-3"
            style={{ width: "100px" }}
            alt="Avatar"
          />
          <h2>{t("forgot_password")}</h2>
        </div>
          <div className="col">
            <form className="border p-4" onSubmit={handleSubmit}>
              <div>
                <label className={`${styles.formLabel} form-label`}>
                  {t("your_email")}
                </label>
                <input
                  type="email"
                  className={`${styles.formInput} form-control`}
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
                type="submit"
              >
                {t("send")}
              </button>
            </form>
          </div>
        </div>
    </>
  );
}

export default ForgotPassword;
