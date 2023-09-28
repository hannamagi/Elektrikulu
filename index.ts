import { Request, Response, Router } from "express";
import Usage from "./models/Usage";
import Device from "./models/Device";
import axios from "axios";
const router: Router = Router();

router.post('/usage', async (req: Request, res: Response) => {
    const startOfUse = req.body.start;
    const endOfUse = req.body.end;
    const kpv1 = new Date(startOfUse);
    const kpv2 = new Date(endOfUse);

    const response = await axios.get(
        "https://dashboard.elering.ee/api/nps/price?start="+startOfUse.split(":")[0]+":00:00.000Z&end="+endOfUse+":00.000Z"
    );

    let sum = 0;
    const prices = response.data.data.ee.slice();

    if (prices.length === 1) {
        const cost = prices[0].price * (kpv2.getMinutes() - kpv1.getMinutes()) / 60;
        sum += cost;
    }

    if (prices.length > 1) {
        const costFirstHour = prices[0].price * (60-kpv1.getMinutes()) / 60;
        sum += costFirstHour;
        const costLastHour = prices[prices.length-1].price * (kpv2.getMinutes()) / 60;
        sum += costLastHour;
    }

    if (prices.length > 2) {
        prices.splice(0,1);
        prices.splice(prices.length-1);
        prices.forEach((element: any) => sum += element.price);
    }

    try{
        const device = await Device.findById(req.body.device);
        if (device) {
            const totalUsageCost = sum / 1000000 * device?.consumption;
            console.log(device?.consumption);
            console.log(totalUsageCost);
            const data = new Usage({
                device: req.body.device,
                customer: req.body.customer,
                startDate: req.body.start,
                endDate: req.body.end,
                totalUsageCost: totalUsageCost
            })
            const dataToSave = await data.save();
            res.status(200).json(dataToSave)
        }
    }
    catch(error){
        res.status(500).json({message: error})
    }
})