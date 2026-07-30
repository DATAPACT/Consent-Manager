// libraries
import { useAuth } from "../../../AuthContext"; // Use AuthContext
import { useEffect, useState } from "react";
import { updateUser } from "../../../services/api";
import { useNavigate } from "react-router-dom"; // Import useNavigate
// css
import styles from "../../../css/CreateRequest.module.css";
import { useTranslation } from "react-i18next";

function OwnerProfile() {
  const { userData, user } = useAuth(); // Get user and logout function from context
  let navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!user) {
        alert(t("user_not_authenticated"));
        return;
      }

      if (formData.new_password !== formData.confirm_password){
        alert(t("new_passwords_do_not_match"));
        return;
      }

      console.log("Something is happening.");

      const result = await updateUser({
        ...formData,
        password: formData.current_password,
        uid: user.uid,
        role: user.role
      });
      
      if (result.success) {
        alert(t("password_changed_successfully"));
        navigate(`/ownerBase/OwnerProfile/${user.uid}`);
      } else {
        alert(t("error_updating_password"));
      }
  };

  useEffect(() => {
      let email = window.localStorage.getItem('emailForSignIn');
      console.log("Email is: ", email);
  }, []);

  
    

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
          <form className="border p-4" onSubmit={handleSubmit}>
            <div className="col">
              <div>
                <label className={`${styles.formLabel} form-label`}>
                  {t("your_name")}
                </label>
                <input
                  type="text"
                  name="name"
                  className={`${styles.formInput} form-control`}
                  required
                  defaultValue={userData?.name}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
              >
                {t("update")}
              </button>
            </div>
            <div className="col">
              <div>
                <label className={`${styles.formLabel} form-label`}>
                  {t("your_email")}
                </label>
                <input
                  type="text"
                  name="email"
                  className={`${styles.formInput} form-control`}
                  defaultValue={userData?.email}
                  onChange={(e) => handleChange(e)}
                  required
                />
              </div>
              <button
                className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
              >
                {t("update")}
              </button>
            </div>
            <div className="border p-4 mt-4">
            <div className="row">
              <div className="col">
                <label className={`${styles.formLabel} form-label`}>
                  {t("current_password")}
                </label>
                <input
                  type="password"
                  name="current_password"
                  className={`${styles.formInput} form-control`}
                  onChange={(e) => handleChange(e)}
                />
              </div>
              <div className="col">
                <label className={`${styles.formLabel} form-label`}>
                  {t("new_password")}
                </label>
                <input
                  type="password"
                  name="new_password"
                  className={`${styles.formInput} form-control`}
                  onChange={(e) => handleChange(e)}
                />
                <label className={`${styles.formLabel} form-label`}>
                  {t("confirm_new_password")}
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  className={`${styles.formInput} form-control`}
                  onChange={(e) => handleChange(e)}
                />
                <button
                  className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
                  onClick={handleSubmit}
                >
                  {t("update")}
                </button>
              </div>
            </div>
            <button className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}>
              {t("change_password")}
            </button>
            </div>
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

export default OwnerProfile;
