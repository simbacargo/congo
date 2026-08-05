import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-lg font-semibold">{t("error.notFound")}</h1>
      <p className="text-sm text-muted">{t("error.notFoundHint")}</p>
      <Link to="/" className="btn btn-primary">
        {t("error.goHome")}
      </Link>
    </div>
  );
}

export function Forbidden() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-lg font-semibold">{t("error.forbidden")}</h1>
      <p className="text-sm text-muted">{t("error.forbiddenHint")}</p>
      <Link to="/" className="btn btn-primary">
        {t("error.goHome")}
      </Link>
    </div>
  );
}
