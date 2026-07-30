// libraries
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../AuthContext"; // Use AuthContext

// css
import styles from "../../../css/CreateRequest.module.css";

function RequesterProfile() {
  const { userData } = useAuth(); // Get user and logout function from context
  const { t } = useTranslation();
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
          <h2>{userData?.name}</h2>
        </div>

        <div className="row mt-5">
          <div className="col">
            <form className="border p-4">
              <div>
                <label className={`${styles.formLabel} form-label`}>
                  {t("your_name")}
                </label>
                <input
                  type="text"
                  className={`${styles.formInput} form-control`}
                  required
                  defaultValue={userData?.name}
                />
              </div>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
              >
                {t("update")}
              </button>
            </form>
          </div>
          <div className="col">
            <form className="border p-4">
              <div>
                <label className={`${styles.formLabel} form-label`}>
                  {t("your_email")}
                </label>
                <input
                  type="text"
                  className={`${styles.formInput} form-control`}
                  required
                />
              </div>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
              >
                {t("update")}
              </button>
            </form>
          </div>
        </div>
        <div className="border p-4 mt-4">
          <form>
            <div className="row">
              <div className="col">
                <label className={`${styles.formLabel} form-label`}>
                  {t("current_password")}
                </label>
                <input
                  type="password"
                  className={`${styles.formInput} form-control`}
                />
              </div>
              <div className="col">
                <label className={`${styles.formLabel} form-label`}>
                  {t("new_password")}
                </label>
                <input
                  type="password"
                  className={`${styles.formInput} form-control`}
                />
              </div>
            </div>
            <button className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}>
              {t("update")}
            </button>
          </form>
        </div>
        <div className="text-center mt-4">
          <a className="text-danger text-decoration-none" href="#">
            {t("delete_account")}
          </a>
        </div>
      </div>
    </>
  );
}

export default RequesterProfile;
