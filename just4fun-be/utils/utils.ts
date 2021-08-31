export function getIntFromQueryParam(param, def)
{
    if (param && typeof param == 'string')
        return parseInt(param, 10);
    else
        return def;
}
