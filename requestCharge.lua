local key = tostring(KEYS[1]);
local charge = tonumber(ARGV[1]);

local oldValue = tonumber(redis.call('GET', key));

if (oldValue >= charge) then
  local value = oldValue - charge
  redis.call('SET', key, value);
  return {value, true};
else
  return {oldValue, false};
end