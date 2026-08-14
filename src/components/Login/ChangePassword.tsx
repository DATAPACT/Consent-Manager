// libraries
import { useTranslation } from "react-i18next";

// css
import styles from "../../css/CreateRequest.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { changePassword } from "../../services/api";

function ChangePassword() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value}));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
        if (formData.new_password === formData.confirm_password) {
            const response = await changePassword(formData.new_password, token);
            
            if (response) {
                alert(t("password_changed_successfully"));
                navigate("/login");
            }
            else {
                alert("error_updating_password");
            }
        }
        else{
            alert(t("new_passwords_do_not_match"));
        }
    }
    else {
        console.error("Token is missing.");
    }
  }

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
          <h2>{t("change_password")}</h2>
        </div>
        <div className="border p-4 mt-4">
          <form>
            <div className="row">
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
              </div>
              <div className="col">
                <label className={`${styles.formLabel} form-label`}>
                  {t("confirm_password")}
                </label>
                <input
                  type="password"
                  name="confirm-password"
                  className={`${styles.formInput} form-control`}
                  onChange={(e) => handleChange(e)}
                />
              </div>
            </div>
            <button className={`${styles.primaryButton} btn btn-sm mt-3 w-20`}
                onClick={handleSubmit}>
              {t("update")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default ChangePassword;
